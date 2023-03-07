"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Game Search context
"""
from __future__ import annotations

from flask import Blueprint, jsonify
from models.game_search_models import GameValues
from services.utils import map_to_dto

api = Blueprint("game_search_api", __name__)


@api.route("/game-values", methods=("GET",))
def get_all_game_values():
    return jsonify(map_to_dto(GameValues.query.all()))  # pyright: ignore[reportOptionalMemberAccess]
