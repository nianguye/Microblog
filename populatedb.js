
// populatedb.js
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

// Placeholder for the database file name
const dbFileName = 'microblog.db';

async function initializeDB() {
    const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashedGoogleId TEXT NOT NULL UNIQUE,
            avatar_url TEXT,
            memberSince DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            username TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            likes INTEGER NOT NULL,
            likedby TEXT 
        );
    `);

    // Sample data - Replace these arrays with your own data

    const posts = [
        { title: 'Sample Post', content: 'This is a sample post.', username: 'SampleUser', timestamp: '2024-01-01 10:00', likes: 1, likedBy: [2]},
        { title: 'Another Post', content: 'This is another sample post.', username: 'AnotherUser', timestamp: '2024-01-02 12:00', likes: 0, likedBy: []},
    ];
    const users = [
        {  username: 'SampleUser', hashedGoogleId: 'hashedGoogleId1',
         avatar_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAD9UlEQVR4nO3bX2iVdRzH8fdp+Yfq5KAtN8Ioh4yMkFUzCyXoJtYfixYTGoFReLdoSgtSSAYyulAvMhBLLNZYuAK9UdSyGpI6JEhnZFmZGtbUEItYW3NdPByejbO2Z3Kenc/PPq+b8+w8vwPf8d72/DlnmeEOhjEZ1xV7ABvNQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAxDiLGQcQ4iBgHEeMgYhxEjIOIcRAx1xd7gKvx8wV4aw/s64Wf+mBgCKpuhfqF8PKjUJaN1p39HeY0wXBHceedjOCCvL0PVn4At9wE6xrg8RrIzoTvfoWuw1DzOjz3EKx8DN79rNjTTl4mpH9p27ALVnVARSkcXAt3lOevOXcJnt4APT/Ez4X0GxLMMeT4WWjpjLbblo0dA6CyFPavhnkVUzdbIQUTZP0uGLoSbS+9d/y1N86ArSvSnykNwQT5pDfezmQmXr+kGu6Zk948aQkmSN/leHvP0WSvWbYonVnSFEyQ8my83dIZndJOpLYqvXnSEkyQxdXx9pmLsKQVjvw4/msW3J7uTGkIJkhzHZSMmPbUeVjcCmu64K+BsV8ze1ZYp7wQUJCFVdD67Ojn/h6EdTtg/quw40hx5iq0oC4MITr9fa0zPgUeqW4BbHweqiunfq5CCS4IwKGT8OIW+OaX/H3TSuCFh6PbKmXZ/P3qggwC0D8IG3dD2074oz9//+xZ8M5L8OQEF5Fqgg2Sc+4SrNkO73XDlTG+k+Y6WN+Y7GJSQfBBcr46Bc3t0P1t/r619fDGM1M+0lW5ZoLkbD8ETe+PvrKfVgJft8FdtxVvrqSCOe1NqmER9L4J98+Nnxscgs2fFm+myQgmSKYx2e0SgPKbYXdLdGDP2XssnbkKLZggEJ3uJlWWhdVPxV+fvlD4edIQVJADJya3ful98fbM6YWdJS1BBen8Egb+Sb6+YsSfrLsDOKBDYEH6LkP7geTrT/4WbzcE8t5IUEEAXmmP3l9PYsv+6LG6ElY8kt5MhRRckD/7o/dCPu4Zf13XYdi0Nzq471wF0wP5wFMwF4aZRti0HOpr4aOe6Lqi9IboJ792bvQplMEhOHoatn0B27qj5z9sgjv/4xMqioIKcn7z6Du4B7+HrZ9Hj2cuRveyKkrhwXnQ8AA8URPOPaycYIL8XwR3DLnWOYgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMQ4ixkHEOIgYBxHjIGIcRIyDiHEQMf8CZljRrBGhTj8AAAAASUVORK5CYII=',
          memberSince: '2024-01-01 08:00'},
        {username: 'AnotherUser',hashedGoogleId: 'hashedGoogleId2',
         avatar_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAEAElEQVR4nO3bzUsqbxjG8evIKK2jF6MXqUVB217I/o6CkFoGBbZr3TLaZpAWRG2icO+qpb1DtGtpIRgZVLtkxuo+i3A4xs+OqTXX8zv3ByTDHG77+ozPBP0SEYGi4fN6AFVOg5DRIGQ0CBkNQkaDkNEgZDQIGQ1CRoOQ0SBkNAgZDUJGg5DRIGQ0CBkNQkaDkNEgZDQIGQ1CRoOQ0SBkNAgZDUJGg5DRIGQ0CBkNQkaDkNEgZDQImf9FkJmZGQwNDXk9RkP8Mv0/qO7v79HT0wPbtnF8fIxwOOz1SHUxfoWsr6/Dtm0AwNramsfT1M/oFVIsFtHb24tcLgcA8Pv9yGQy6Orq8niy2hm9QpLJJHK5HCzLAvAeaHNz0+Op6iQGGx0dFQCSSCQEgACQ1tZWKRQKXo9WM2ODnJycCAAZHx8XEZGxsTE3ys7OjsfT1c7YU1bpA3xhYaHsKwCsrq56MlNDeP2OqMXt7a0EAgHp6OgQ27ZFRMRxHOns7HRXyeHhocdT1sbIFZJIJOA4Dubn5xEIBAC877BmZ2fdnzF1C2zcttdxHIRCITw+PiKbzaK9vd197M+LRMuycH19bdwW2LgVsr+/j7u7O0xNTZXFAIC2tjZMTEwAAF5eXrCxseHFiPXx+pz5VSMjIwJAzs/P//Px09NTo7fARgU5OjoSABIOhz/9udL1CQDZ3t7+meEaxKhT1setbiXRaNS9H4vFvnWmhvP6HVGtXC4nfr+/bKtbiW3bEgwG3VWSTqd/aMr6GbNC4vE4isUi5ubm3K1uJYFAwNgtsBHbXtu2EQqFkM/na3q+ZVnIZDLo7u5u8GSNZ8QK2dvbQz6fx/T0NOR9I1LVLRKJAHjfAicSCY9fRZU8OVF+0fDwsACQs7OzLz2v9AdIANLS0iLPz8/fNGHj0AdJp9NVbXUrKV23AJCtra0GT9d49Kes0rb1b1vdSv7cAhvx4e71O+IzV1dX4vP5JBgMiuM4NR2jUChIc3Ozu0pSqVSDp2ws6hWyvLyMt7c3RCIR+P3+mo7R1NSEyclJ9/ulpSUI8caSNkgqlcLu7i4AoL+/v65jDQ4OuvcvLi6wsrJS1/G+lddL9KObmxuJxWJlp5m+vj5JJpOSzWbl9fW16mM9PDzIwcGBDAwMuMcCID6fT6LRqFxeXv71qv+n0QWxLKvsl/fxFo/HqzrO09PTp8cp3RYXF7/5FX2NEVfq/xLaz5B/lQYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HIaBAyGoSMBiGjQchoEDIahIwGIaNByGgQMhqEjAYho0HI/AbLZAYbyph6eQAAAABJRU5ErkJggg=='
        , memberSince: '2024-01-02 09:00'},
    ];

    // Insert sample data into the database
    const existingUsers = await db.all('SELECT username from users');
    if (existingUsers.length == 0) {
        await Promise.all(users.map(user => {
                return db.run(
                    'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
                    [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince]
                );

        }));
    }

    const existingPost = await db.all('SELECT * from posts')
    if (existingPost.length == 0) {
        await Promise.all(posts.map(post => {

        return db.run(
            'INSERT INTO posts (title, content, username, timestamp, likes, likedby) VALUES (?, ?, ?, ?, ?, ?)',
            [post.title, post.content, post.username, post.timestamp, post.likes, post.likedBy.join(",")]
        );
    }));
    }
    console.log('Database populated with initial data.');
    await db.close();
}

initializeDB().catch(err => {
    console.error('Error initializing database:', err);
});

module.exports = { initializeDB };