import sqlite3

def main():
    conn = sqlite3.connect('terramind_x.db')
    cur = conn.cursor()
    
    # List tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables in database:")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cur.fetchone()[0]
        print(f" - {t}: {cnt} rows")
        
        # Check first row
        cur.execute(f"SELECT * FROM {t} LIMIT 1")
        row = cur.fetchone()
        print(f"   Example: {row}")

if __name__ == '__main__':
    main()
