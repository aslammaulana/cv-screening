import { createAdminClient } from '../lib/supabase/server';

async function exportConfig() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('ai_config').select('*').single();
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- PERSONA PROMPT ---');
    console.log(data.persona_prompt);
    console.log('--- SCORING PROMPT ---');
    console.log(data.scoring_prompt);
}

exportConfig();
