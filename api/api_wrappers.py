from flask import current_app, jsonify, request
from functools import wraps
from models.core_models import Player
from typing import List
import jwt


def authentication_required(f):
    @wraps(f)
    def _verify(*args, **kwargs):
        auth_headers: List[str] = request.headers.get('Authorization', '').split()

        invalid_msg = {
            'message': 'Invalid token. Authentification and / or authentication required',
            'authenticated': False
        }
        expired_msg = {
            'message': 'Expired token. Reauthentication required.',
            'authenticated': False
        }

        if len(auth_headers) != 2:
            return jsonify(invalid_msg), 401

        try:
            token = auth_headers[1]
            data = jwt.decode(token, current_app.config['SECRET_KEY'])
            player: Player = Player.query.filter_by(user_id=data['sub']).first()
            if not player:
                raise RuntimeError('User not found')
            return f(player, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify(expired_msg), 401
        except jwt.InvalidTokenError:
            return jsonify(invalid_msg), 401

    return _verify
