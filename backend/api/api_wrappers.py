import json

from datetime import datetime, timedelta
from functools import wraps
from flask import current_app, jsonify, request
import jwt

from models.core_models import Player


def authentication_required(f):
    @wraps(f)
    def _verify(*args, **kwargs):
        auth_headers: list[str] = request.headers.get("Authorization", "").split()

        invalid_msg = {
            "message": "Invalid token. Authentification and / or authentication required",
            "authenticated": False
        }
        expired_msg = {
            "message": "Expired token. Reauthentication required.",
            "authenticated": False
        }

        if len(auth_headers) != 2:
            return jsonify(invalid_msg), 401

        try:
            token = auth_headers[1]
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify(expired_msg), 401
        except jwt.InvalidTokenError:
            return jsonify(invalid_msg), 401

        player = Player.query.filter_by(user_id=data["sub"]).first()
        if not player:
            raise RuntimeError("User not found")

        response = f(player, *args, **kwargs)

        # Extend the expiration date of the JWT since the user is active
        # Newly generated token needs to be sent back to frontent
        if not isinstance(response, tuple):
            return response

        extended_token = jwt.encode({
            "sub": data["sub"],
            "iat": data["iat"],
            "exp": datetime.utcnow() + timedelta(days=1)},
            current_app.config["SECRET_KEY"])
        try:
            response_content = json.loads(response[0])
        except json.JSONDecodeError:
            response_content = {"message": response[0]}

        return (
            json.dumps({
                **response_content,
                "token": extended_token,
            }),
            response[1])

    return _verify
