from typing import Dict, List, Any

GAMETYPE_MULTI_GAME = "rj1dy1o8"
BasicJSONType = Dict[str, Any]


def extract_valid_personal_bests(runs: List[BasicJSONType]) -> List[BasicJSONType]:
    """
    Check if it's a valid run:
    - not a "multi-game" gametype
    - has a category
    - has video verification
    """
    best_know_runs: BasicJSONType = {}

    def keep_if_pb(run: BasicJSONType):
        game = run["game"]["data"]["id"]
        category = run["category"]
        level = run["level"]["data"]["id"] if run["level"]["data"] else ""
        sorted_dict = sorted(get_subcategory_variables(run).items())
        subcategories = str(sorted_dict)
        identifier = game + category + level + subcategories

        existing_best = best_know_runs.get(identifier)
        if not existing_best \
                or existing_best["times"]["primary_t"] > run["times"]["primary_t"]:
            best_know_runs[identifier] = run

    for run in runs:
        if GAMETYPE_MULTI_GAME not in run["game"]["data"]["gametypes"] \
                and run["category"] \
                and run.get("videos"):
            keep_if_pb(run)

    return list(best_know_runs.values())


def get_subcategory_variables(run: BasicJSONType) -> Dict[str, Dict[str, str]]:
    """
    Produce a Dictionary of a run's sub-categories where:
    - key: variable id (ex: Framerate)
    - value: variable value (ex: 60 FPS, 144hz, Uncapped)
    """
    # Get a list of the game's subcategory variables
    game_subcategory_ids: List[str] = [
        game_variable["id"]
        for game_variable in run["game"]["data"]["variables"]["data"]
        if game_variable["is-subcategory"]
    ]

    # Only Keep the variables that are one of the game's subcategories
    return {
        pb_var_id: pb_var_value
        for pb_var_id, pb_var_value in run["values"].items()
        if pb_var_id in game_subcategory_ids
    }
