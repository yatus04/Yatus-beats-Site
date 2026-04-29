create table if not exists app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_state (id, data)
values (
  'site',
  '{
    "beats": [
      {
        "id": "9tq_dURbYuo",
        "title": "India",
        "style": "African Drill Mbalakh",
        "bpm": 152,
        "key": "Non precisee",
        "mood": "Percutant, africain, drill",
        "youtube": "https://youtu.be/9tq_dURbYuo",
        "audio": "assets/audio/india-preview-short.wav",
        "popular": true
      },
      {
        "id": "nwEaxBznCD8",
        "title": "Mali",
        "style": "African Drill",
        "bpm": null,
        "key": "Non precisee",
        "mood": "Lourd, tribal, sombre",
        "youtube": "https://youtu.be/nwEaxBznCD8",
        "audio": "assets/audio/mali-preview.mp3",
        "popular": true
      },
      {
        "id": "hbyxp2dGqc8",
        "title": "Maroc",
        "style": "Drill Mbalakh",
        "bpm": 147,
        "key": "Non precisee",
        "mood": "Mystique, drill, mbalakh",
        "youtube": "https://youtu.be/hbyxp2dGqc8",
        "audio": "assets/audio/maroc-preview.mp3",
        "popular": true
      }
    ],
    "stats": {},
    "visits": []
  }'::jsonb
)
on conflict (id) do nothing;
