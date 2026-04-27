from cookbook_pipeline.stages.stage_6_intros import extract_region_intros


def test_extract_region_intros_splits_on_h2():
    front_matter = {
        "regions_overview": {
            "markdown": (
                "Some preamble.\n\n"
                "## Awadh\n\n"
                "The cuisine of Awadh is famous for its slow cooking.\n\n"
                "## Punjab\n\n"
                "Punjabi food is robust and dairy-rich.\n\n"
                "## Tamil Nadu\n\n"
                "Tamil cuisine is rice-centric.\n"
            )
        }
    }
    intros = extract_region_intros(front_matter, ["Awadh", "Punjab"])
    assert "Awadh" in intros
    assert "Punjab" in intros
    assert "Tamil Nadu" not in intros  # filtered
    assert "slow cooking" in intros["Awadh"]
    assert "dairy-rich" in intros["Punjab"]


def test_extract_region_intros_handles_empty_body():
    front_matter = {"regions_overview": {"markdown": ""}}
    intros = extract_region_intros(front_matter, ["Awadh"])
    assert intros == {}


def test_extract_region_intros_no_matching_regions():
    front_matter = {
        "regions_overview": {
            "markdown": "## Bengal\n\nBengali food is fish-rich.\n"
        }
    }
    intros = extract_region_intros(front_matter, ["Awadh"])
    assert intros == {}
