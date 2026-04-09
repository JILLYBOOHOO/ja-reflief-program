const mysql = require('mysql2/promise');

async function searchDB() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'RroJjWAayNeE1@13',
        database: 'ja_relief'
    });

    try {
        const [tables] = await connection.query('SHOW TABLES');
        for (const tableEntry of tables) {
            const tableName = Object.values(tableEntry)[0];
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
            
            for (const col of columns) {
                const colName = col.Field;
                const [rows] = await connection.query(`SELECT * FROM ${tableName} WHERE \`${colName}\` LIKE '%Identity verification%'`);
                if (rows.length > 0) {
                    console.log(`FOUND IN Table: ${tableName}, Column: ${colName}`);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

searchDB();
