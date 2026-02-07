<?php
/**
 * Seed Users via Web Interface
 * Upload this file to your API directory and visit it in browser
 * DELETE THIS FILE after seeding for security!
 */

// Security: Only allow localhost or admin IPs
$allowed_ips = ['127.0.0.1', 'localhost'];
// Add your IP here if needed: $allowed_ips[] = 'YOUR.IP.ADDRESS';

if (!in_array($_SERVER['REMOTE_ADDR'], $allowed_ips) && !isset($_GET['force'])) {
    die('Access denied. Add your IP to allowed_ips or use ?force=1');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Janus Platform - Seed Database</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px; }
        .button:hover { background: #45a049; }
        .danger { background: #f44336; }
        .danger:hover { background: #da190b; }
        .result { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-top: 20px; white-space: pre-wrap; }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>🌱 Janus Platform - Database Seeder</h1>

    <p><strong>⚠️ IMPORTANT:</strong> Supprime ce fichier après utilisation!</p>

    <h2>MongoDB Configuration</h2>
    <form method="GET">
        <label>MongoDB URI:</label><br>
        <input type="text" name="mongo_uri" style="width: 100%; padding: 10px; margin: 10px 0;"
               value="<?= htmlspecialchars($_GET['mongo_uri'] ?? getenv('MONGODB_URI') ?? '') ?>"
               placeholder="mongodb+srv://user:pass@cluster.mongodb.net/janus-platform"><br>

        <button type="submit" name="action" value="seed_users" class="button">🌱 Seed Users</button>
        <button type="submit" name="action" value="test_connection" class="button">🔍 Test Connection</button>
        <button type="button" onclick="location.href='?action=delete_file'" class="button danger">🗑️ Delete This File</button>
    </form>

    <?php
    if (isset($_GET['action'])) {
        $mongo_uri = $_GET['mongo_uri'] ?? getenv('MONGODB_URI');

        if (empty($mongo_uri)) {
            echo '<div class="result error">❌ MongoDB URI is required!</div>';
            exit;
        }

        echo '<div class="result">';

        if ($_GET['action'] === 'delete_file') {
            if (unlink(__FILE__)) {
                echo '<span class="success">✅ File deleted successfully! You can close this page.</span>';
            } else {
                echo '<span class="error">❌ Could not delete file. Please delete manually via File Manager.</span>';
            }
        } elseif ($_GET['action'] === 'test_connection') {
            testMongoConnection($mongo_uri);
        } elseif ($_GET['action'] === 'seed_users') {
            seedUsers($mongo_uri);
        }

        echo '</div>';
    }

    function testMongoConnection($uri) {
        try {
            $manager = new MongoDB\Driver\Manager($uri);
            $command = new MongoDB\Driver\Command(['ping' => 1]);
            $result = $manager->executeCommand('admin', $command);

            echo '<span class="success">✅ MongoDB connection successful!</span>' . "\n";
            echo 'Connected to: ' . parse_url($uri, PHP_URL_HOST) . "\n";
        } catch (Exception $e) {
            echo '<span class="error">❌ Connection failed:</span>' . "\n";
            echo $e->getMessage();
        }
    }

    function seedUsers($uri) {
        try {
            $manager = new MongoDB\Driver\Manager($uri);

            // Parse database name from URI
            $path = parse_url($uri, PHP_URL_PATH);
            $db_name = trim($path, '/');
            if (strpos($db_name, '?') !== false) {
                $db_name = substr($db_name, 0, strpos($db_name, '?'));
            }
            if (empty($db_name)) $db_name = 'janus-platform';

            echo "Database: $db_name\n\n";

            // Users to create
            $users = [
                [
                    'userId' => 'user-admin-demo',
                    'organizationId' => 'demo-org-1',
                    'name' => 'Admin Demo',
                    'email' => 'admin@janus-demo.com',
                    'role' => 'admin',
                    'status' => 'active',
                    'passwordHash' => password_hash('admin123', PASSWORD_BCRYPT),
                    'createdAt' => new MongoDB\BSON\UTCDateTime(),
                    'updatedAt' => new MongoDB\BSON\UTCDateTime(),
                    'lastLogin' => new MongoDB\BSON\UTCDateTime(),
                ],
                [
                    'userId' => 'user-manager-acme',
                    'organizationId' => 'demo-org-1',
                    'name' => 'Manager Acme',
                    'email' => 'manager@acme-corp.com',
                    'role' => 'manager',
                    'status' => 'active',
                    'passwordHash' => password_hash('manager123', PASSWORD_BCRYPT),
                    'createdAt' => new MongoDB\BSON\UTCDateTime(),
                    'updatedAt' => new MongoDB\BSON\UTCDateTime(),
                    'lastLogin' => null,
                ],
                [
                    'userId' => 'user-participant-acme',
                    'organizationId' => 'demo-org-1',
                    'name' => 'Jean Dupont',
                    'email' => 'participant@acme-corp.com',
                    'role' => 'participant',
                    'status' => 'active',
                    'passwordHash' => password_hash('participant123', PASSWORD_BCRYPT),
                    'createdAt' => new MongoDB\BSON\UTCDateTime(),
                    'updatedAt' => new MongoDB\BSON\UTCDateTime(),
                    'lastLogin' => null,
                ],
            ];

            $bulk = new MongoDB\Driver\BulkWrite;
            foreach ($users as $user) {
                $bulk->insert($user);
            }

            $result = $manager->executeBulkWrite("$db_name.users", $bulk);

            echo '<span class="success">✅ Successfully created ' . $result->getInsertedCount() . ' users!</span>' . "\n\n";
            echo "Created users:\n";
            foreach ($users as $user) {
                echo "  • {$user['name']} ({$user['email']}) - Role: {$user['role']}\n";
            }
            echo "\n<strong>Login credentials:</strong>\n";
            echo "  Email: admin@janus-demo.com\n";
            echo "  Password: admin123\n";

        } catch (Exception $e) {
            echo '<span class="error">❌ Error creating users:</span>' . "\n";
            echo $e->getMessage();
        }
    }
    ?>

    <hr>
    <p><small>⚠️ <strong>Security Warning:</strong> Delete this file immediately after seeding!</small></p>
</body>
</html>
