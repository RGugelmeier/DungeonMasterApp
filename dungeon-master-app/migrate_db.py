import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, make_transient
from dotenv import load_dotenv
from server import create_app
from server.database import db
import server.models as models

def migrate():
    # 1. Load the current MySQL configuration
    load_dotenv(dotenv_path='.env', override=True)
    
    print(f"Connecting to source MySQL database...")
    src_app = create_app()
    
    # 3. Prepare SQLite
    sqlite_path = 'instance/database.db'
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)
        
    sqlite_url = f"sqlite:///{os.path.abspath(sqlite_path)}"
    print(f"Creating target SQLite database at: {sqlite_url}")
    
    dest_engine = create_engine(sqlite_url)
    models.db.Model.metadata.create_all(dest_engine)
    Session = sessionmaker(bind=dest_engine)
    dest_session = Session()

    # 2. Extract and 4. Insert (inside app context)
    with src_app.app_context():
        model_classes = [
            models.Users, models.Campaigns, models.Tags, models.Notebooks, 
            models.Chapters, models.Pages, models.PlayerCharacters, 
            models.NonPlayerCharacters, models.CharacterPageLinks
        ]
        
        try:
            for model in model_classes:
                print(f"Migrating {model.__tablename__}...")
                items = model.query.all()
                print(f"  Moving {len(items)} records...")
                for item in items:
                    # Fix NULL updated_at issue
                    if hasattr(item, 'updated_at') and item.updated_at is None:
                        if hasattr(item, 'created_at') and item.created_at is not None:
                            item.updated_at = item.created_at
                        else:
                            from datetime import datetime
                            item.updated_at = datetime.now()
                            
                    db.session.expunge(item)
                    make_transient(item)
                    dest_session.add(item)
                dest_session.commit()
            print("Migration complete! Database file created at instance/database.db")
        except Exception as e:
            dest_session.rollback()
            print(f"Error during migration: {e}")
            raise
        finally:
            dest_session.close()

if __name__ == "__main__":
    migrate()
