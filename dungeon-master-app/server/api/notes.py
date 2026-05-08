from flask import Blueprint, jsonify, request
import re
from server.models import Tags, Pages, Chapters, Notebooks, Campaigns, Users, ChapterCategories
from server.database import db
from flask_jwt_extended import jwt_required, get_jwt_identity

notes_bp = Blueprint("notes", __name__, url_prefix="/notes")

# Gets all campaigns belonging to the current user.
@notes_bp.get("/get_campaigns")
@jwt_required()
def get_campaigns():
    user_id = int(get_jwt_identity())
    campaigns = Campaigns.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'campaign_id': c.campaign_id,
        'user_id': c.user_id,
        'campaign_name': c.campaign_name,
        'campaign_description': c.campaign_description,
        'created_at': c.created_at,
        'updated_at': c.updated_at
    } for c in campaigns]), 200

# This function retrieves all notebooks, chapters, and pages for a campaign.
# Used to populate the NotesDashboard tree and to give the AI access to note content.
def fetch_campaign_notes(campaign_id):
    notebooks = Notebooks.query.filter_by(campaign_id=campaign_id).all()
    result = []
    for notebook in notebooks:
        chapters = Chapters.query.filter_by(notebook_id=notebook.notebook_id).all()
        if not chapters:
            result.append({
                'notebook_id': notebook.notebook_id,
                'notebook': notebook.notebook_name,
                'chapter_id': None,
                'chapter': None,
                'chapter_category': None,
                'pages': []
            })
            continue
        for chapter in chapters:
            pages = Pages.query.filter_by(chapter_id=chapter.chapter_id).order_by(Pages.sort_order).all()
            result.append({
                'notebook_id': notebook.notebook_id,
                'notebook': notebook.notebook_name,
                'chapter_id': chapter.chapter_id,
                'chapter': chapter.chapter_name,
                'chapter_category': chapter.chapter_category.value,
                'pages': [
                    {
                        'page_id': p.page_id,
                        'page_name': p.page_name,
                        'page_content': p.page_content
                    } for p in pages
                ]
            })
    return result

@notes_bp.post("/get_campaign_notes")
@jwt_required()
def get_campaign_notes():
    data = request.get_json()
    if not data or 'active_campaign' not in data:
        return jsonify({"error": "Invalid data when fetching notes"}), 400
    notes = fetch_campaign_notes(data['active_campaign'])
    return jsonify(notes), 200

@notes_bp.post("/save_page")
@jwt_required()
def save_page():
    data = request.get_json()
    if not data or 'page_id' not in data or 'content' not in data:
        return jsonify({"error": "page_id and content are required"}), 400
    page = Pages.query.get(data['page_id'])
    if not page:
        return jsonify({"error": "Page not found"}), 404
    page.page_content = data['content']
    db.session.commit()
    return jsonify({"success": True}), 200


@notes_bp.post("/add_notebook")
@jwt_required()
def add_notebook():
    data = request.get_json()
    if not data or 'campaign_id' not in data or 'name' not in data:
        return jsonify({"error": "campaign_id and name are required"}), 400
    notebook = Notebooks(campaign_id=data['campaign_id'], notebook_name=data['name'])
    db.session.add(notebook)
    db.session.commit()
    return jsonify({"notebook_id": notebook.notebook_id, "name": notebook.notebook_name}), 201


@notes_bp.post("/add_chapter")
@jwt_required()
def add_chapter():
    data = request.get_json()
    if not data or 'notebook_id' not in data or 'name' not in data or 'category' not in data:
        return jsonify({"error": "notebook_id, name, and category are required"}), 400
    chapter = Chapters(
        notebook_id=data['notebook_id'],
        chapter_name=data['name'],
        chapter_category=ChapterCategories(data['category'])
    )
    db.session.add(chapter)
    db.session.commit()
    return jsonify({"chapter_id": chapter.chapter_id, "name": chapter.chapter_name}), 201


@notes_bp.post("/add_page")
@jwt_required()
def add_page():
    data = request.get_json()
    if not data or 'chapter_id' not in data or 'name' not in data:
        return jsonify({"error": "chapter_id and name are required"}), 400
    max_order = db.session.query(db.func.max(Pages.sort_order)).filter_by(chapter_id=data['chapter_id']).scalar() or 0
    page = Pages(chapter_id=data['chapter_id'], page_name=data['name'], page_content="", sort_order=max_order + 1)
    db.session.add(page)
    db.session.commit()
    return jsonify({"page_id": page.page_id, "name": page.page_name}), 201

@notes_bp.post("/reorder_pages")
@jwt_required()
def reorder_pages():
    data = request.get_json()
    if not data or 'page_ids' not in data:
        return jsonify({"error": "page_ids required"}), 400
    for index, page_id in enumerate(data['page_ids']):
        page = Pages.query.get(page_id)
        if page:
            page.sort_order = index
    db.session.commit()
    return jsonify({"success": True}), 200

@notes_bp.post("/rename_notebook")
@jwt_required()
def rename_notebook():
    data = request.get_json()
    if not data or 'notebook_id' not in data or 'name' not in data:
        return jsonify({"error": "notebook_id and name are required"}), 400
    notebook = Notebooks.query.get(data['notebook_id'])
    if not notebook:
        return jsonify({"error": "Notebook not found"}), 404
    notebook.notebook_name = data['name'].strip()
    db.session.commit()
    return jsonify({"success": True}), 200

@notes_bp.post("/rename_chapter")
@jwt_required()
def rename_chapter():
    data = request.get_json()
    if not data or 'chapter_id' not in data or 'name' not in data:
        return jsonify({"error": "chapter_id and name are required"}), 400
    chapter = Chapters.query.get(data['chapter_id'])
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    chapter.chapter_name = data['name'].strip()
    db.session.commit()
    return jsonify({"success": True}), 200

@notes_bp.post("/rename_page")
@jwt_required()
def rename_page():
    data = request.get_json()
    if not data or 'page_id' not in data or 'name' not in data:
        return jsonify({"error": "page_id and name are required"}), 400
    page = Pages.query.get(data['page_id'])
    if not page:
        return jsonify({"error": "Page not found"}), 404
    page.page_name = data['name'].strip()
    db.session.commit()
    return jsonify({"success": True}), 200

@notes_bp.delete("/delete_notebook")
@jwt_required()
def delete_notebook():
    data = request.get_json()
    if not data or 'notebook_id' not in data:
        return jsonify({"error": "notebook_id required when deleting notebook"}), 400
    notebook_to_delete = Notebooks.query.filter_by(notebook_id=data['notebook_id']).first()
    if not notebook_to_delete:
        return jsonify({'error': 'Invalid notebook_id when deleting notebook.'}), 400
    db.session.delete(notebook_to_delete)
    db.session.commit()
    return jsonify({'status': 'Notebook deleted.'}), 200

@notes_bp.delete("/delete_chapter")
@jwt_required()
def delete_chapter():
    data = request.get_json()
    if not data or 'chapter_id' not in data:
        return jsonify({"error": "chapter_id required when deleting chapter"}), 400
    chapter_to_delete = Chapters.query.filter_by(chapter_id=data['chapter_id']).first()
    if not chapter_to_delete:
        return jsonify({'error': 'Invalid chapter_id when deleting chapter.'}), 400
    db.session.delete(chapter_to_delete)
    db.session.commit()
    return jsonify({'status': 'Chapter deleted.'}), 200

@notes_bp.delete("/delete_page")
@jwt_required()
def delete_page():
    data = request.get_json()
    if not data or 'page_id' not in data:
        return jsonify({"error": "page_id required when deleting page"}), 400
    page_to_delete = Pages.query.filter_by(page_id=data['page_id']).first()
    if not page_to_delete:
        return jsonify({'error': 'Invalid page_id when deleting page.'}), 400
    db.session.delete(page_to_delete)
    db.session.commit()
    return jsonify({'status': 'Page deleted.'}), 200

@notes_bp.post("/get_tags")
@jwt_required()
def get_tags():
    data = request.get_json()
    if not data or 'campaign_id' not in data:
        return jsonify({"error": "campaign_id required"}), 400
    tags = Tags.query.filter_by(campaign_id=data['campaign_id']).all()
    return jsonify([{'tag_id': t.tag_id, 'tag': t.tag} for t in tags]), 200

@notes_bp.post("/add_tag")
@jwt_required()
def add_tag():
    data = request.get_json()
    if not data or 'campaign_id' not in data or 'name' not in data:
        return jsonify({"error": "campaign_id and name are required"}), 400
    tag = Tags(campaign_id=data['campaign_id'], tag=data['name'].strip())
    db.session.add(tag)
    db.session.commit()
    return jsonify({"tag_id": tag.tag_id, "tag": tag.tag}), 201

@notes_bp.delete("/delete_tag")
@jwt_required()
def delete_tag():
    data = request.get_json()
    if not data or 'tag_id' not in data:
        return jsonify({"error": "tag_id required"}), 400
    tag = Tags.query.get(data['tag_id'])
    if not tag:
        return jsonify({"error": "Tag not found"}), 404
    db.session.delete(tag)
    db.session.commit()
    return jsonify({"success": True}), 200

@notes_bp.post("/search_tag")
@jwt_required()
def search_tag():
    data = request.get_json()
    if not data or 'tag_id' not in data:
        return jsonify({"error": "tag_id required"}), 400
    tag = Tags.query.get(data['tag_id'])
    if not tag:
        return jsonify({"error": "Tag not found"}), 404
    pattern = re.compile(re.escape(tag.tag), re.IGNORECASE)
    results = []
    rows = (
        db.session.query(Pages, Chapters, Notebooks)
        .join(Chapters, Pages.chapter_id == Chapters.chapter_id)
        .join(Notebooks, Chapters.notebook_id == Notebooks.notebook_id)
        .filter(Notebooks.campaign_id == tag.campaign_id)
        .all()
    )
    for page, chapter, notebook in rows:
        text = re.sub(r'<[^>]+>', '', page.page_content or '')
        count = len(pattern.findall(text))
        if count > 0:
            results.append({
                'page_id': page.page_id,
                'page_name': page.page_name,
                'chapter_id': chapter.chapter_id,
                'chapter_name': chapter.chapter_name,
                'notebook_id': notebook.notebook_id,
                'notebook_name': notebook.notebook_name,
                'count': count
            })
    return jsonify({'tag': tag.tag, 'results': results}), 200