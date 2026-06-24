-- Push-notify the assigned rider when a customer sends a chat message.
-- Mirrors the existing notify_rider_of_offer pattern: look up the rider's
-- Expo push token, fire an HTTP POST via pg_net, and swallow any errors so
-- a push failure never blocks the insert.

create or replace function public.notify_rider_of_chat_message()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_rider_id uuid;
  v_token    text;
  v_sender   text;
begin
  if new.sender_role <> 'user' then
    return new;
  end if;

  begin
    select d.rider_id into v_rider_id
      from public.deliveries d
     where d.id = new.delivery_id;

    if v_rider_id is null then
      return new;
    end if;

    select r.expo_push_token into v_token
      from public.riders r
     where r.id = v_rider_id;

    if v_token is null then
      return new;
    end if;

    -- Best-effort sender name from the users table.
    select coalesce(u.full_name, 'Customer') into v_sender
      from public.users u
     where u.id = new.sender_id;
    v_sender := coalesce(v_sender, 'Customer');

    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'Accept',       'application/json'),
      body    := jsonb_build_object(
                   'to',        v_token,
                   'title',     v_sender,
                   'body',      left(new.body, 200),
                   'sound',     'default',
                   'priority',  'high',
                   'channelId', 'chat-messages',
                   'data',      jsonb_build_object(
                                  'type',        'chat_message',
                                  'delivery_id', new.delivery_id
                                )
                 )
    );
  exception when others then
    raise warning 'notify_rider_of_chat_message failed for message %: %', new.id, sqlerrm;
  end;

  return new;
end;
$function$;

-- Fire after insert so the row is already committed when the push goes out.
drop trigger if exists trg_notify_rider_chat_message on public.messages;
create trigger trg_notify_rider_chat_message
  after insert on public.messages
  for each row
  execute function public.notify_rider_of_chat_message();
