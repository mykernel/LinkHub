#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql

conn = pymysql.connect(
    host='172.16.63.222',
    port=3307,
    user='root',
    password='1234567',
    database='linkhub',
    charset='utf8mb4'
)

cursor = conn.cursor()
cursor.execute("SELECT id, user_id, name, icon FROM categories LIMIT 5")
results = cursor.fetchall()

print("数据库中的分类数据:")
for row in results:
    print(f"  ID: {row[0]}, User ID: {row[1]}, Name: {row[2]}, Icon: {row[3]}")

cursor.close()
conn.close()