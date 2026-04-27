import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import anthropic
import httpx
import pytest

from cookbook_pipeline.stages.stage_4_clean import build_id, clean_all, clean_recipe_block


def _fake_msg(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    return msg


def _auth_error():
    """Wrong API key — propagates without retry, mirrors a real systemic failure."""
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    return anthropic.APIStatusError(
        "auth", response=httpx.Response(401, request=request), body=None
    )


def _rate_limit_error():
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    return anthropic.RateLimitError(
        "rate limited", response=httpx.Response(429, request=request), body=None
    )


def _make_blocks(n: int, start_page: int = 100) -> list[dict]:
    return [
        {
            "page_num": start_page + i,
            "title_hint": f"Recipe {i}",
            "raw_text": f"Recipe {i} body",
            "section_id": "snacks-and-appetizers",
            "section_name": "Snacks and Appetizers",
        }
        for i in range(n)
    ]


def _seed_page_images(images_dir: Path, blocks: list[dict]) -> None:
    images_dir.mkdir(parents=True, exist_ok=True)
    for b in blocks:
        path = images_dir / f"page-{b['page_num']:04d}.png"
        path.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 32)


def test_clean_recipe_block_returns_validated_recipe(fixtures_dir: Path, tmp_path: Path):
    canned = (fixtures_dir / "mock_clean_response.json").read_text()
    client = MagicMock()
    client.messages.create.return_value = _fake_msg(canned)

    image_path = tmp_path / "page-096-image.png"
    image_path.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)

    block = {
        "page_num": 96,
        "title_hint": "Nargisi Seekh Kebab",
        "raw_text": "Nargisi Seekh Kebab\nVegetable & Egg Skewers\n\nOrigin Awadh\n...",
        "section_id": "snacks-and-appetizers",
        "section_name": "Snacks and Appetizers",
    }
    recipe = clean_recipe_block(client, block, image_path, model="m")
    assert recipe.name == "Nargisi Seekh Kebab"
    assert recipe.section_id == "snacks-and-appetizers"
    assert recipe.origin_region_name == "Awadh"
    assert recipe.origin_region_id == "awadh"
    assert recipe.id == "nargisi-seekh-kebab"
    assert recipe.source_page == 96
    assert recipe.heat_level == 1


def test_build_id_collisions_get_suffix():
    seen = {"pakoras"}
    assert build_id("Pakoras", seen) == "pakoras-2"
    seen.add("pakoras-2")
    assert build_id("Pakoras", seen) == "pakoras-3"


def test_clean_all_aborts_when_majority_of_calls_fail(tmp_path: Path):
    """Systemic failure (e.g. wrong API key) should abort before the second
    pass instead of silently writing an all-failed result."""
    blocks = _make_blocks(20)
    images_dir = tmp_path / "images"
    _seed_page_images(images_dir, blocks)
    output_path = tmp_path / "recipes.cleaned.json"
    failures_path = tmp_path / "failures.json"

    client = MagicMock()
    # 401 propagates without retry, mirroring an unrecoverable systemic failure.
    client.messages.create.side_effect = _auth_error()

    with pytest.raises(RuntimeError, match="Aborting Stage 4"):
        clean_all(
            blocks,
            images_dir,
            output_path,
            failures_path,
            client=client,
            concurrency=2,
        )

    # Pre-existing output must NOT be overwritten by an empty result.
    assert not output_path.exists()


def test_clean_all_preserves_prior_output_on_systemic_failure(tmp_path: Path):
    blocks = _make_blocks(20)
    images_dir = tmp_path / "images"
    _seed_page_images(images_dir, blocks)
    output_path = tmp_path / "recipes.cleaned.json"
    failures_path = tmp_path / "failures.json"
    prior = '[{"id": "prior-recipe"}]'
    output_path.write_text(prior)

    client = MagicMock()
    client.messages.create.side_effect = _auth_error()

    with pytest.raises(RuntimeError):
        clean_all(blocks, images_dir, output_path, failures_path, client=client, concurrency=2)

    assert output_path.read_text() == prior


def test_clean_all_aborts_after_rate_limit_retries_exhausted(tmp_path: Path):
    """Rate limits hitting on every call (e.g. Tier 1 with concurrency=8) should
    surface as a systemic-failure abort, not a silent zero-recipe completion."""
    blocks = _make_blocks(20)
    images_dir = tmp_path / "images"
    _seed_page_images(images_dir, blocks)
    output_path = tmp_path / "recipes.cleaned.json"
    failures_path = tmp_path / "failures.json"

    client = MagicMock()
    client.messages.create.side_effect = _rate_limit_error()

    # Skip the exponential-backoff sleeps so the test runs in milliseconds.
    with patch("cookbook_pipeline.llm.client.time.sleep"):
        with pytest.raises(RuntimeError, match="Aborting Stage 4"):
            clean_all(
                blocks,
                images_dir,
                output_path,
                failures_path,
                client=client,
                concurrency=2,
            )

    assert not output_path.exists()


def test_clean_all_does_not_abort_below_failure_threshold(
    fixtures_dir: Path, tmp_path: Path
):
    """When most calls succeed (failure rate <= 50%), the stage should complete."""
    canned_ok = (fixtures_dir / "mock_clean_response.json").read_text()
    blocks = _make_blocks(20)
    images_dir = tmp_path / "images"
    _seed_page_images(images_dir, blocks)
    output_path = tmp_path / "recipes.cleaned.json"
    failures_path = tmp_path / "failures.json"

    client = MagicMock()
    # 5 auth failures + 15 successes = 25% failure rate.
    side_effects = [_auth_error()] * 5 + [_fake_msg(canned_ok)] * 15
    client.messages.create.side_effect = side_effects

    summary = clean_all(
        blocks,
        images_dir,
        output_path,
        failures_path,
        client=client,
        concurrency=1,
    )

    assert summary["extracted"] >= 10
    assert summary["failed"] == 5
    assert output_path.exists()
    assert failures_path.exists()


def test_clean_all_does_not_abort_with_few_blocks(tmp_path: Path):
    """With fewer than 20 blocks (e.g. pilot run), don't trigger abort
    even at 100% failure — the per-recipe failures path should run normally."""
    blocks = _make_blocks(5)
    images_dir = tmp_path / "images"
    _seed_page_images(images_dir, blocks)
    output_path = tmp_path / "recipes.cleaned.json"
    failures_path = tmp_path / "failures.json"

    client = MagicMock()
    client.messages.create.side_effect = _auth_error()

    summary = clean_all(
        blocks,
        images_dir,
        output_path,
        failures_path,
        client=client,
        concurrency=1,
    )

    assert summary == {"extracted": 0, "failed": 5}
    assert json.loads(output_path.read_text()) == []
    assert len(json.loads(failures_path.read_text())) == 5
