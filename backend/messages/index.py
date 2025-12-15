'''
Обработка сообщений в мессенджере
Отправка, получение и управление сообщениями в чатах
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'send':
                chat_id = body.get('chat_id')
                sender_id = body.get('sender_id')
                text = body.get('text', '').strip()
                
                if not chat_id or not sender_id or not text:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id, sender_id и text обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, chat_id, sender_id, text, read, created_at",
                    (chat_id, sender_id, text)
                )
                message = cur.fetchone()
                
                cur.execute("UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (chat_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': dict(message)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_chat':
                user_ids = body.get('user_ids', [])
                name = body.get('name')
                is_group = body.get('is_group', False)
                
                if not user_ids or len(user_ids) < 2:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Минимум 2 участника требуется'}),
                        'isBase64Encoded': False
                    }
                
                if not is_group and len(user_ids) == 2:
                    cur.execute(
                        '''SELECT c.id FROM chats c
                        JOIN chat_members cm1 ON c.id = cm1.chat_id
                        JOIN chat_members cm2 ON c.id = cm2.chat_id
                        WHERE c.is_group = FALSE
                        AND cm1.user_id = %s AND cm2.user_id = %s''',
                        (user_ids[0], user_ids[1])
                    )
                    existing = cur.fetchone()
                    if existing:
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'chat_id': existing['id'], 'exists': True}),
                            'isBase64Encoded': False
                        }
                
                avatar = f"https://api.dicebear.com/7.x/shapes/svg?seed={name or 'chat'}"
                
                cur.execute(
                    "INSERT INTO chats (name, avatar, is_group) VALUES (%s, %s, %s) RETURNING id",
                    (name, avatar, is_group)
                )
                chat = cur.fetchone()
                chat_id = chat['id']
                
                for idx, user_id in enumerate(user_ids):
                    is_admin = idx == 0 if is_group else False
                    cur.execute(
                        "INSERT INTO chat_members (chat_id, user_id, is_admin) VALUES (%s, %s, %s)",
                        (chat_id, user_id, is_admin)
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')
            chat_id = params.get('chat_id')
            
            if chat_id:
                cur.execute(
                    '''SELECT m.id, m.chat_id, m.sender_id, m.text, m.read, m.created_at,
                       u.username, u.name, u.avatar
                       FROM messages m
                       JOIN users u ON m.sender_id = u.id
                       WHERE m.chat_id = %s
                       ORDER BY m.created_at ASC''',
                    (chat_id,)
                )
                messages = [dict(row) for row in cur.fetchall()]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
            
            elif user_id:
                cur.execute(
                    '''SELECT DISTINCT c.id, c.name, c.avatar, c.is_group, c.updated_at,
                       (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) as member_count,
                       (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                       COALESCE(cs.pinned, FALSE) as pinned,
                       (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != %s AND m.read = FALSE) as unread_count
                       FROM chats c
                       JOIN chat_members cm ON c.id = cm.chat_id
                       LEFT JOIN chat_settings cs ON c.id = cs.chat_id AND cs.user_id = %s
                       WHERE cm.user_id = %s
                       ORDER BY COALESCE(last_message_time, c.created_at) DESC''',
                    (user_id, user_id, user_id)
                )
                chats = [dict(row) for row in cur.fetchall()]
                
                for chat in chats:
                    if not chat['is_group']:
                        cur.execute(
                            '''SELECT u.id, u.username, u.name, u.avatar, u.online
                            FROM users u
                            JOIN chat_members cm ON u.id = cm.user_id
                            WHERE cm.chat_id = %s AND u.id != %s
                            LIMIT 1''',
                            (chat['id'], user_id)
                        )
                        other_user = cur.fetchone()
                        if other_user:
                            chat['name'] = other_user['name']
                            chat['avatar'] = other_user['avatar']
                            chat['online'] = other_user['online']
                            chat['other_user_id'] = other_user['id']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id или chat_id обязателен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'mark_read':
                chat_id = body.get('chat_id')
                user_id = body.get('user_id')
                
                if not chat_id or not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id и user_id обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE messages SET read = TRUE WHERE chat_id = %s AND sender_id != %s AND read = FALSE",
                    (chat_id, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'pin_chat':
                chat_id = body.get('chat_id')
                user_id = body.get('user_id')
                pinned = body.get('pinned', True)
                
                if not chat_id or not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id и user_id обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    '''INSERT INTO chat_settings (chat_id, user_id, pinned)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (chat_id, user_id) DO UPDATE SET pinned = %s''',
                    (chat_id, user_id, pinned, pinned)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
