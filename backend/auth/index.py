'''
Аутентификация и регистрация пользователей в мессенджере
Обрабатывает регистрацию новых пользователей, вход и обновление профиля
'''

import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token() -> str:
    return secrets.token_urlsafe(32)


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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token',
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
            
            if action == 'register':
                username = body.get('username', '').strip()
                name = body.get('name', '').strip()
                password = body.get('password', '')
                
                if not username or not name or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь с таким username уже существует'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
                
                cur.execute(
                    "INSERT INTO users (username, name, password_hash, avatar, online) VALUES (%s, %s, %s, %s, TRUE) RETURNING id, username, name, avatar, bio, online",
                    (username, name, password_hash, avatar)
                )
                user = cur.fetchone()
                conn.commit()
                
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'token': token,
                        'user': dict(user)
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                username = body.get('username', '').strip()
                password = body.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Username и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, username, name, avatar, banner, bio, online FROM users WHERE username = %s AND password_hash = %s",
                    (username, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный username или пароль'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("UPDATE users SET online = TRUE WHERE id = %s", (user['id'],))
                conn.commit()
                
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'token': token,
                        'user': dict(user)
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            token = event.get('headers', {}).get('X-User-Token') or event.get('headers', {}).get('x-user-token')
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if 'name' in body and body['name']:
                updates.append("name = %s")
                params.append(body['name'])
            
            if 'username' in body and body['username']:
                updates.append("username = %s")
                params.append(body['username'])
            
            if 'bio' in body:
                updates.append("bio = %s")
                params.append(body['bio'])
            
            if 'avatar' in body:
                updates.append("avatar = %s")
                params.append(body['avatar'])
            
            if 'banner' in body:
                updates.append("banner = %s")
                params.append(body['banner'])
            
            if not updates:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет данных для обновления'}),
                    'isBase64Encoded': False
                }
            
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, username, name, avatar, banner, bio, online"
            
            cur.execute(query, tuple(params))
            user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': dict(user)}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            search = params.get('search', '').strip()
            
            if search:
                cur.execute(
                    "SELECT id, username, name, avatar, bio, online FROM users WHERE username ILIKE %s OR name ILIKE %s LIMIT 20",
                    (f'%{search}%', f'%{search}%')
                )
            else:
                cur.execute("SELECT id, username, name, avatar, bio, online FROM users LIMIT 50")
            
            users = [dict(row) for row in cur.fetchall()]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users}),
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
