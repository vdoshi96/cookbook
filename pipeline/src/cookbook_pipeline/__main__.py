"""CLI entry point. Filled in incrementally as stages are added."""

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="cookbook_pipeline")
    parser.add_argument("command", choices=["run", "pilot"])
    parser.add_argument("--stage", type=int, default=None)
    args = parser.parse_args(argv)
    print(f"Pipeline scaffolded. command={args.command}, stage={args.stage}.")
    print("Stages will be wired up in subsequent tasks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
