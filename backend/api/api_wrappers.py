import json
from datetime import datetime, timedelta
from functools import wraps
from typing import Union

import jwt
from flask import current_app, jsonify, request
from models.core_models import Player


def authentication_required(fn):
    @wraps(fn)
    def _verify(*args, **kwargs):
        auth_headers: list[str] = request.headers.get("Authorization", "").split()

        invalid_msg = {
            "message": "Invalid token. Authentification and / or authentication required",
            "authenticated": False,
        }
        expired_msg = {
            "message": "Expired token. Reauthentication required.",
            "authenticated": False,
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

        response = fn(player, *args, **kwargs)

        # Extend the expiration date of the JWT since the user is active
        # Newly generated token needs to be sent back to frontent
        # TODO: When instance of response instead of str, can we still add the token to it?
        if not isinstance(response, tuple) or not isinstance(response[0], str):
            return response

        extended_token: Union[bytes, str] = jwt.encode(
            {
                "sub": data["sub"],
                "iat": data["iat"],
                "exp": datetime.utcnow() + timedelta(days=1),
            },
            current_app.config["SECRET_KEY"],
        )
        if isinstance(extended_token, bytes):
            extended_token = extended_token.decode()
        try:
            response_message: dict[str, str] = json.loads(response[0])
        except json.JSONDecodeError:
            response_message = {"message": response[0]}

        try:
            response_content = {**response_message}
        except TypeError:
            response_content = {"message": response_message}

        return (
            json.dumps({
                **response_content,
                "token": extended_token,
            }),
            response[1],
        )

    return _verify
