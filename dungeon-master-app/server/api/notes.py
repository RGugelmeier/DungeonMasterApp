from flask import Blueprint, jsonify, request
from server.models import Tags, Pages, Chapters, Notebooks
from server.database import db

notes_bp = Blueprint("notes", __name__, url_prefix="/notes")