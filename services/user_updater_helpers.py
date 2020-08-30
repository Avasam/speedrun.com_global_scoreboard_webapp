from typing import Dict, List, Any

GAMETYPE_MULTI_GAME = "rj1dy1o8"
BasicJSONType = Dict[str, Any]
MIN_LEADERBOARD_SIZE = 3  # This is just to optimize as the formula gives 0 points to leaderboards size < 3


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
        if (not run["level"]["data"] or run["times"]["primary_t"] >= 60) \
                and GAMETYPE_MULTI_GAME not in run["game"]["data"]["gametypes"] \
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


def keep_last_full_game_runs(runs: List[BasicJSONType], max: int):
    return sorted(
        filter(
            lambda run: not run["level"]["data"],
            runs),
        key=lambda run: run["date"],
        reverse=True
    )[:max]


def get_probability_terms(pbs: List[BasicJSONType]):
    mean: float = 0.0
    sigma: float = 0.0
    population: int = 0
    for pb in pbs:
        value = pb["run"]["times"]["primary_t"]
        population += 1
        mean_temp = mean
        mean += (value - mean_temp) / population
        sigma += (value - mean_temp) * (value - mean)
    standard_deviation = (sigma / population) ** 0.5

    return mean, standard_deviation, population


def keep_runs_before_soft_cutoff(runs: List[BasicJSONType], ):
    i: int = len(runs)
    cut_off_80th_percentile: int = runs[int(i*0.8)]["run"]["times"]["primary_t"]
    count: int = 0
    most_repeated_time_lowest_pos: int = 0
    most_repeated_time_count: int = 0
    previous_value: int = 0
    # Go in reverse this way we can break at the percentile
    for run in reversed(runs):
        value: int = run["run"]["times"]["primary_t"]
        if value == previous_value:
            count += 1
        else:
            if count > most_repeated_time_count:
                most_repeated_time_count = count
                most_repeated_time_lowest_pos = i + 1
            count = 0
        previous_value = value

        # We hit the 80th percentile, there's no more to be analyzed
        # If the most repeated time IS the 80th percentile, still remove it (< not <=)
        if value < cut_off_80th_percentile:
            # Have the most repeated time repeat at least a certain amount
            if most_repeated_time_count > MIN_LEADERBOARD_SIZE:
                # Actually keep the last one as it'll be worth 0 points and used for other calculations
                return runs[:most_repeated_time_lowest_pos]
            break
        i -= 1

    return runs
