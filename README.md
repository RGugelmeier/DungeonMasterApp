# Srawler - A D&D Note helper and World Builder
Welcome to Srawler!

This app is designed to make note taking easy and note information retrieval even easier for Dungeon Masters and players alike.

### Your Account
In scrawler, your notes are stored in a database, not on your system. These notes are linked to your account that you can make directly on the front page of the app. **Your information is safe!**. Passwords are hidden using bcrypt's hashing and salting algorithms before being stored in the database. This means that no one can see your password, not even the app itself! Your notes, email address, and other data is stored in the database for it to be easily accessed by the app, so to stay safe, make sure not to put any sensitive information in any of your notes.

### Note Storage
Scrawler is designed to be an organized way to write your notes for world building and keeping track of your sessions, players, NPCs, etc. All notes follow a hierarchy of:
```
Campaign
└── Notebook
    └── Chapter
        └── Page
```
In your account, you can have up to 6 campaigns, with unlimited notebooks, chapters, and pages, allowing you to keep track of multiple worlds to any extent you desire!

### Character Storage
In D&D, it can sometimes be hard to quickly access a character's stats, inventory, spells, etc. In Scrawler, you are able to swap your main window to easily view character information as well! Simply create a new character in Scrawler and input all of their information! In the character's page, you are also able to link pages of your notes to the character. This allows you to have a page dedicated to information about an NPC for example that can link directly to your character sheet, and also have a page dedicated to their hometown that is also linked to their character sheet.

### Note Retrieval
In the heat of a session, it can be hard to look through your notes to find a bit of critical information while not slowing down the rest of the table. Scrawler has a couple of solutions just for this!
1. **Built in AI Note Retrieval**  
   Each campaign comes equipped with its own built in LLM that can quickly retrieve information from your notes for you. Need to know where Skjorn the pirate captain that you haven't talked about in 10 sessions was originally from? Ask your AI and it will not only retrieve that information for you through a note searching tool, but it will also list exactly what Notebook, Chapter, and Page the information comes from so you can verify for any pesky AI hallucinations quickly.

   Keep in mind, this AI has been instructed to only provide help in note retrieval! It is not designed to help with world building, narrative, or anything creative. Leave that up to your own creative mind like D&D is intended!
2. **Tags**  
   For each campaign, you are able to create custom tags. Each time you create a tag, you can click on that tag in your tag lists to see every time that tag appears in your campaign's notes. This allows you to quickly find any references to a town, character, magic item, or anything you need to gather all important information about.
