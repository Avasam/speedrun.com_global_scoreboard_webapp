"""
Provides the API endpoints for consuming and producing REST requests and
responses within the Game Search context
"""
from api.api_wrappers import authentication_required
from flask import Blueprint, jsonify
from models.core_models import Player
from models.game_search_models import GameValues
from services.utils import map_to_dto

api = Blueprint('game_search_api', __name__)


@api.route('/game-values', methods=('GET',))
@authentication_required
def get_all_game_values(current_user: Player):
    return jsonify(map_to_dto(GameValues.query.all()))
