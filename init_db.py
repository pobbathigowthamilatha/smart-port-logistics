"""
Database Initialization Script for AI-Powered Smart Port & Logistics Management System
Creates database.db in the project root and initializes the SQLite schema.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")


def init_db():
    print(f"Initializing SQLite Database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Vessels Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Vessels (
        vessel_id TEXT PRIMARY KEY,
        vessel_name TEXT NOT NULL,
        imo_number TEXT NOT NULL,
        arrival_date TEXT,
        departure_date TEXT,
        cargo_capacity INTEGER,
        assigned_berth TEXT,
        current_status TEXT
    );
    """
    )

    # 2. Cargo Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Cargo (
        cargo_id TEXT PRIMARY KEY,
        cargo_type TEXT NOT NULL,
        weight REAL,
        source TEXT,
        destination TEXT,
        assigned_vessel TEXT,
        assigned_yard TEXT,
        current_status TEXT
    );
    """
    )

    # 3. Trucks Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Trucks (
        truck_id INTEGER PRIMARY KEY AUTOINCREMENT,
        truck_number TEXT NOT NULL,
        driver_name TEXT,
        cargo_reference TEXT,
        entry_time TEXT,
        exit_time TEXT,
        gate_id TEXT,
        gate_status TEXT,
        queue_status TEXT
    );
    """
    )

    # 4. Berths Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Berths (
        berth_id TEXT PRIMARY KEY,
        berth_name TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_vessel TEXT
    );
    """
    )

    # 5. Reports Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Reports (
        report_id TEXT PRIMARY KEY,
        report_type TEXT NOT NULL,
        generated_date TEXT,
        report_data TEXT
    );
    """
    )

    # 6. Users Table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    );
    """
    )

    # Seed Sample Initial Data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM Vessels")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
        INSERT INTO Vessels (vessel_id, vessel_name, imo_number, arrival_date, departure_date, cargo_capacity, assigned_berth, current_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            [
                (
                    "VSL-101",
                    "MSC Oscar",
                    "IMO 9703291",
                    "2026-08-16 04:30",
                    "2026-08-18 18:00",
                    19224,
                    "Berth B-01",
                    "Docked",
                ),
                (
                    "VSL-102",
                    "CMA CGM Antoine",
                    "IMO 9776432",
                    "2026-08-16 06:15",
                    "2026-08-17 22:00",
                    20600,
                    "Berth B-02",
                    "Docked",
                ),
                (
                    "VSL-103",
                    "Ever Given",
                    "IMO 9811000",
                    "2026-08-16 09:00",
                    "2026-08-19 12:00",
                    20124,
                    "Berth B-04",
                    "Docked",
                ),
                (
                    "VSL-104",
                    "Maersk Mc-Kinney",
                    "IMO 9632064",
                    "2026-08-16 11:30",
                    "2026-08-18 08:00",
                    18270,
                    "Berth B-05",
                    "Docked",
                ),
                (
                    "VSL-105",
                    "OOCL Hong Kong",
                    "IMO 9776171",
                    "2026-08-16 14:00",
                    "2026-08-19 06:00",
                    21413,
                    "Berth B-07",
                    "Docked",
                ),
                (
                    "VSL-106",
                    "HMM Algeciras",
                    "IMO 9863297",
                    "2026-08-16 16:45",
                    "2026-08-20 10:00",
                    23964,
                    "Anchorage Area",
                    "Anchored",
                ),
            ],
        )

    cursor.execute("SELECT COUNT(*) FROM Cargo")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
        INSERT INTO Cargo (
            cargo_id,
            cargo_type,
            weight,
            source,
            destination,
            assigned_vessel,
            assigned_yard,
            current_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            [
                (
                    "CRG-1001",
                    "Containerized",
                    28.5,
                    "Shanghai, CN",
                    "Rotterdam, NL",
                    "MSC Oscar",
                    "Yard Block A-14",
                    "In Yard",
                ),
                (
                    "CRG-1002",
                    "Containerized (Reefer)",
                    18.2,
                    "Santos, BR",
                    "Hamburg, DE",
                    "CMA CGM Antoine",
                    "Reefer Zone R-03",
                    "In Yard",
                ),
                (
                    "CRG-1003",
                    "Dry Bulk",
                    4500.0,
                    "Odessa, UA",
                    "Antwerp, BE",
                    "Ever Given",
                    "Silo Complex 2",
                    "Unloading",
                ),
                (
                    "CRG-1004",
                    "Liquid Bulk",
                    1250.0,
                    "Houston, US",
                    "Rotterdam, NL",
                    "Maersk Mc-Kinney",
                    "Hazmat Zone H-01",
                    "Customs Hold",
                ),
                (
                    "CRG-1005",
                    "Breakbulk",
                    142.0,
                    "Yokohama, JP",
                    "Duisburg, DE",
                    "OOCL Hong Kong",
                    "Heavy Lift Yard H-09",
                    "In Transit",
                ),
            ],
        )

    cursor.execute("SELECT COUNT(*) FROM Berths")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
        INSERT INTO Berths (berth_id, berth_name, status, assigned_vessel)
        VALUES (?, ?, ?, ?)
        """,
            [
                ("B-01", "Berth B-01 (Deepwater Pier Alpha)", "Occupied", "MSC Oscar"),
                (
                    "B-02",
                    "Berth B-02 (Deepwater Pier Alpha)",
                    "Occupied",
                    "CMA CGM Antoine",
                ),
                ("B-03", "Berth B-03 (Deepwater Pier Alpha)", "Maintenance", "None"),
                ("B-04", "Berth B-04 (Deepwater Pier Alpha)", "Occupied", "Ever Given"),
                (
                    "B-05",
                    "Berth B-05 (Container Pier Beta)",
                    "Occupied",
                    "Maersk Mc-Kinney",
                ),
                ("B-06", "Berth B-06 (Container Pier Beta)", "Available", "None"),
                ("B-07", "Berth B-07 (Container Pier Beta)", "Occupied", "HMM Algeciras"),
                ("B-08", "Berth B-08 (Container Pier Beta)", "Available", "None"),
            ],
        )

    cursor.execute("SELECT COUNT(*) FROM Users")
    if cursor.fetchone()[0] == 0:
        cursor.executemany(
            """
        INSERT INTO Users (username, password, role)
        VALUES (?, ?, ?)
        """,
            [
                ("gowthami", "admin123", "Chief Logistics Operator"),
                ("operator1", "pass123", "Berth Controller"),
            ],
        )

    conn.commit()
    conn.close()
    print("Database initialization complete! database.db is ready.")


if __name__ == "__main__":
    init_db()
