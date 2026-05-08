from flask import Blueprint, jsonify, request
from server.models import PlayerCharacters, NonPlayerCharacters, CharacterPageLinks, Pages, Chapters, Notebooks
from server.database import db
from flask_jwt_extended import jwt_required

characters_bp = Blueprint("characters", __name__, url_prefix="/characters")

CHAR_FIELDS = ['character_name', 'owning_player', 'hp', 'ac',
               'strength', 'dexterity', 'constitution',
               'wisdom', 'intelligence', 'charisma',
               'inventory', 'abilities', 'spells']

def serialize_character(c, char_type):
    return {
        'character_id': c.character_id,
        'type': char_type,
        'character_name': c.character_name,
        'owning_player': c.owning_player,
        'hp': c.hp,
        'ac': c.ac,
        'strength': c.strength,
        'dexterity': c.dexterity,
        'constitution': c.constitution,
        'wisdom': c.wisdom,
        'intelligence': c.intelligence,
        'charisma': c.charisma,
        'inventory': c.inventory,
        'abilities': c.abilities,
        'spells': c.spells,
    }

def fetch_campaign_characters(campaign_id):
    pcs = PlayerCharacters.query.filter_by(campaign_id=campaign_id).all()
    npcs = NonPlayerCharacters.query.filter_by(campaign_id=campaign_id).all()
    return {
        'player_characters': [serialize_character(c, 'pc') for c in pcs],
        'non_player_characters': [serialize_character(c, 'npc') for c in npcs],
    }

@characters_bp.post("/get_characters")
@jwt_required()
def get_characters():
    data = request.get_json()
    if not data or 'campaign_id' not in data:
        return jsonify({"error": "campaign_id is required"}), 400
    return jsonify(fetch_campaign_characters(data['campaign_id'])), 200

@characters_bp.post("/add_character")
@jwt_required()
def add_character():
    data = request.get_json()
    if not data or 'campaign_id' not in data or 'character_name' not in data or 'type' not in data:
        return jsonify({"error": "campaign_id, character_name, and type are required"}), 400

    defaults = dict(
        campaign_id=data['campaign_id'],
        character_name=data['character_name'],
        owning_player=data.get('owning_player', ''),
        hp=0, ac=0,
        strength=10, dexterity=10, constitution=10,
        wisdom=10, intelligence=10, charisma=10,
        inventory={}, abilities={}, spells={}
    )

    if data['type'] == 'pc':
        char = PlayerCharacters(**defaults)
    elif data['type'] == 'npc':
        char = NonPlayerCharacters(**defaults)
    else:
        return jsonify({"error": "type must be 'pc' or 'npc'"}), 400

    db.session.add(char)
    db.session.commit()
    return jsonify(serialize_character(char, data['type'])), 201

@characters_bp.post("/update_character")
@jwt_required()
def update_character():
    data = request.get_json()
    if not data or 'character_id' not in data or 'type' not in data:
        return jsonify({"error": "character_id and type are required"}), 400

    Model = PlayerCharacters if data['type'] == 'pc' else NonPlayerCharacters
    char = Model.query.get(data['character_id'])
    if not char:
        return jsonify({"error": "Character not found"}), 404

    for field in CHAR_FIELDS:
        if field in data:
            setattr(char, field, data[field])

    db.session.commit()
    return jsonify(serialize_character(char, data['type'])), 200

def serialize_link(link):
    page = Pages.query.get(link.page_id)
    chapter = Chapters.query.get(page.chapter_id) if page else None
    notebook = Notebooks.query.get(chapter.notebook_id) if chapter else None
    return {
        'link_id': link.link_id,
        'page_id': link.page_id,
        'page_name': page.page_name if page else '',
        'chapter_name': chapter.chapter_name if chapter else '',
        'notebook_name': notebook.notebook_name if notebook else '',
    }

@characters_bp.post("/get_links")
@jwt_required()
def get_links():
    data = request.get_json()
    if not data or 'character_id' not in data or 'character_type' not in data:
        return jsonify({"error": "character_id and character_type required"}), 400
    links = CharacterPageLinks.query.filter_by(
        character_id=data['character_id'],
        character_type=data['character_type']
    ).all()
    return jsonify([serialize_link(l) for l in links]), 200

@characters_bp.post("/add_link")
@jwt_required()
def add_link():
    data = request.get_json()
    if not data or 'character_id' not in data or 'character_type' not in data or 'page_id' not in data:
        return jsonify({"error": "character_id, character_type, and page_id required"}), 400
    existing = CharacterPageLinks.query.filter_by(
        character_id=data['character_id'],
        character_type=data['character_type'],
        page_id=data['page_id']
    ).first()
    if existing:
        return jsonify({"error": "Already linked"}), 409
    link = CharacterPageLinks(
        character_id=data['character_id'],
        character_type=data['character_type'],
        page_id=data['page_id']
    )
    db.session.add(link)
    db.session.commit()
    return jsonify(serialize_link(link)), 201

@characters_bp.delete("/delete_link")
@jwt_required()
def delete_link():
    data = request.get_json()
    if not data or 'link_id' not in data:
        return jsonify({"error": "link_id required"}), 400
    link = CharacterPageLinks.query.get(data['link_id'])
    if not link:
        return jsonify({"error": "Link not found"}), 404
    db.session.delete(link)
    db.session.commit()
    return jsonify({"success": True}), 200
