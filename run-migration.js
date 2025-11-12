const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        console.log('🔄 Connecting to database...');
        
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS,
            database: process.env.DB_NAME || 'student_senior_db'
        });

        console.log('✅ Connected to database successfully');

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'seniors'
        `, [process.env.DB_NAME || 'student_senior_db']);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('📋 Existing columns in seniors table:', existingColumns);

        const phoneColumns = ['phone1', 'phone2', 'phone3'];
        const missingColumns = phoneColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
            console.log('✅ All phone columns already exist!');
            return;
        }

        console.log('🔄 Adding missing columns:', missingColumns);

        // Add missing columns
        for (const column of missingColumns) {
            await connection.execute(`
                ALTER TABLE seniors 
                ADD COLUMN ${column} VARCHAR(20)
            `);
            console.log(`✅ Added column: ${column}`);
        }

        // Verify the columns were added
        const [newColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'seniors'
        `, [process.env.DB_NAME || 'student_senior_db']);

        console.log('📋 Updated columns in seniors table:', newColumns.map(col => col.COLUMN_NAME));
        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
runMigration();