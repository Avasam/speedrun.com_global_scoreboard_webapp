from typing import Any, Dict, List, Tuple
from models.global_scoreboard_models import Run

GAMETYPE_MULTI_GAME = "rj1dy1o8"
BasicJSONType = Dict[str, Any]
MIN_LEADERBOARD_SIZE = 3  # This is just to optimize as the formula gives 0 points to leaderboards size < 3
MIN_SAMPLE_SIZE = 100


def extract_valid_personal_bests(runs: List[BasicJSONType]) -> List[BasicJSONType]:
    """
    Check if it's a valid run:
    - is over a minute (or an IL, we don't have access to the IL's fraction yet)
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


def extract_sorted_valid_runs_from_leaderboard(
        leaderboard: BasicJSONType,
        level_fraction: float) -> List[BasicJSONType]:
    """
    Check if the run is valid:
    - none of the players are banned
    - place is at least 1
    - has video verification

    Check if the leaderboard is valid:
    - WR is over its fraction of a minute
    - has more than MIN_LEADERBOARD_SIZE players
    - not a scoreboard

    Returns the sorted valid runs from a leaderboard. Or empty list if the leaderboard is invalid.
    """
    wr = leaderboard["runs"][0]["run"]
    wr_time = wr["times"]["primary_t"]
    # Note: If needed in the future, level_fraction could be extracted from the leaderboard data
    if wr_time < 60 * level_fraction or len(leaderboard["runs"]) < MIN_LEADERBOARD_SIZE:
        return []

    is_board_known_speedrun = False

    # Get a list of all banned players in this leaderboard
    banned_players = [p["id"] for p in leaderboard["players"]["data"]
                      if p.get("role") == "banned"]

    valid_runs = []
    for run in leaderboard["runs"]:
        value = run["run"]["times"]["primary_t"]

        # Making sure this is a speedrun and not a score leaderboard
        # To avoid false negatives due to missing primary times, stop comparing once we know it's a speedrun
        if not is_board_known_speedrun:
            if value < wr_time:
                return []  # Score based leaderboard. No need to keep looking
            elif value > wr_time:
                is_board_known_speedrun = True

        # Check if the run is valid
        if run["place"] > 0 \
                and run["run"].get("videos") \
                and not any(p.get("id") in banned_players for p in run["run"]["players"]):
            valid_runs.append(run)

    return sorted(valid_runs, key=lambda r: r["run"]["times"]["primary_t"])


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
        [run for run in runs if not run["level"]["data"]],
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


def extract_top_runs_and_score(runs: List[Run]) -> Tuple[List[Run], List[Run]]:
    top_runs, lesser_runs = [], []
    position = 0

    def is_top_run(run: Run):
        nonlocal position
        if position + run.level_fraction <= MIN_SAMPLE_SIZE:
            position += run.level_fraction
            return True

    runs.sort(key=lambda r: r._points / r.level_fraction, reverse=True)
    for run in runs:
        (top_runs if is_top_run(run) else lesser_runs).append(run)

    return top_runs, lesser_runs
