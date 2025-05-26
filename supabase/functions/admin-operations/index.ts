import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { operation, data } = await req.json();

    switch (operation) {
      case 'addAsset': {
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('assets')
          .insert(data)
          .select()
          .single();

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({ data: insertedData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'updateAsset': {
        const { id, ...updateData } = data;
        const { data: updatedData, error: updateError } = await supabaseClient
          .from('assets')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ data: updatedData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'deleteAsset': {
        const { error: deleteError } = await supabaseClient
          .from('assets')
          .delete()
          .eq('id', data.id);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ message: 'Asset deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});