# OptimaBook — Edge Functions (truri AI)

## `chat` — truri bisedor

Merr mesazhin e klientit, e kupton me Gemini, gjen orare reale nga databaza
dhe rezervon (transaksional). Flet çdo gjuhë.

### Vendosja (nga paneli i Supabase — pa instalime)

1. **Shto çelësin Gemini si secret:**
   - Supabase → ⚙ **Project Settings** → **Edge Functions** → **Add secret**
   - Name: `GEMINI_API_KEY` · Value: çelësi `AIza...` (ose `AQ...`) → **Save**
   - *(SUPABASE_URL dhe SUPABASE_SERVICE_ROLE_KEY jepen automatikisht nga Supabase.)*

2. **Vendos funksionin:**
   - Supabase → **Edge Functions** → **Deploy a new function** (editor në browser)
   - Emri: `chat`
   - Ngjit përmbajtjen e `chat/index.ts` → **Deploy**

3. **Testo** (nga terminali ose nga unë me curl):
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/functions/v1/chat" \
     -H "Authorization: Bearer <ANON_OR_PUBLISHABLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"business_id":"<id>","text":"a ke neser ne 3 nje orar per qethje?"}'
   ```

### Hapi tjetër
Lidhja me WhatsApp/Instagram/Telegram → secili kanal thërret këtë funksion.
