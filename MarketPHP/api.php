<?php
    // api.php - Backend para MySQL (Corregido para compatibilidad con JS)
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // --- CREDENCIALES (CAMBIAR AQUI) ---
    $host = "sql308.infinityfree.com"; // TU HOST MYSQL
    $db_name = "if0_39546028_yufoods";    // TU NOMBRE DE BD
    $username = "if0_39546028";        // TU USUARIO BD
    $password = "3dgHUXGsIQI";       // TU CONTRASEÑA BD
    // -----------------------------------

    try {
        $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
        $conn->exec("set names utf8");
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch(PDOException $exception) {
        echo json_encode(["error" => "Error de conexión: " . $exception->getMessage()]);
        exit;
    }

    $resource = isset($_GET['resource']) ? $_GET['resource'] : '';
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents("php://input"), true);

    // 1. PRODUCTOS
    if ($resource === 'productos') {
        if ($method === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM products");
            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // AQUÍ ESTÁ LA CORRECCIÓN MÁGICA:
            // Convertimos 'category_id' (SQL) a 'categoryId' (JS)
            foreach($products as &$p) {
                $p['visible'] = (bool)$p['visible'];
                $p['id'] = (int)$p['id'];
                $p['categoryId'] = (int)$p['category_id']; // <--- TRADUCCIÓN IMPORTANTE
                unset($p['category_id']); // Borramos la versión antigua para no confundir
                $p['price'] = (float)$p['price'];
            }

            echo json_encode(['products' => $products]);
        }
        elseif ($method === 'PUT' && isset($input['products'])) {
            $conn->exec("TRUNCATE TABLE products"); 
            $stmt = $conn->prepare("INSERT INTO products (id, category_id, name, unit, price, image, visible) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach($input['products'] as $p) {
                // El JS envía 'categoryId', así que lo usamos para guardar en 'category_id'
                $catId = isset($p['categoryId']) ? $p['categoryId'] : (isset($p['category_id']) ? $p['category_id'] : 0);
                $stmt->execute([$p['id'], $catId, $p['name'], $p['unit'], $p['price'] ?? 0, $p['image'], $p['visible']?1:0]);
            }
            echo json_encode(["message" => "Productos actualizados"]);
        }
    }

    // 2. CATEGORIAS
    elseif ($resource === 'categorias') {
        if ($method === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM categories");
            $stmt->execute();
            $cats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach($cats as &$c) {
                $c['visible'] = (bool)$c['visible'];
                $c['id'] = (int)$c['id'];
            }
            echo json_encode(['categories' => $cats]);
        }
        elseif ($method === 'PUT' && isset($input['categories'])) {
            $conn->exec("TRUNCATE TABLE categories");
            $stmt = $conn->prepare("INSERT INTO categories (id, name, image, visible) VALUES (?, ?, ?, ?)");
            foreach($input['categories'] as $c) {
                $stmt->execute([$c['id'], $c['name'], $c['image'], $c['visible']?1:0]);
            }
            echo json_encode(["message" => "Categorias actualizadas"]);
        }
    }

    // 3. PEDIDOS
    elseif ($resource === 'carritoCompra') {
        if ($method === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM orders ORDER BY timestamp DESC");
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach($orders as &$o) {
                $o['items'] = json_decode($o['items_json'] ?? '[]');
                // Traducción para JS
                $o['userId'] = $o['user_id'];
                $o['date'] = $o['date_text'];

                $o['total'] = (float)$o['total'];
                $o['timestamp'] = (float)$o['timestamp'];

                unset($o['items_json']);
                unset($o['user_id']);
                unset($o['date_text']);
            }
            echo json_encode(['orders' => $orders]);
        }
        elseif ($method === 'PUT' && isset($input['orders'])) {
            $stmtCheck = $conn->prepare("SELECT id FROM orders WHERE id = ?");
            $stmtInsert = $conn->prepare("INSERT INTO orders (id, date_text, customer, address, phone, notes, status, items_json, total, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtUpdate = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");

            foreach($input['orders'] as $o) {
                $stmtCheck->execute([$o['id']]);
                if($stmtCheck->rowCount() == 0) {
                    $itemsJson = json_encode($o['items']);
                    // Aseguramos que existan las variables antes de insertar
                    $uId = isset($o['userId']) ? $o['userId'] : (isset($o['user_id']) ? $o['user_id'] : '');
                    $dText = isset($o['date']) ? $o['date'] : (isset($o['date_text']) ? $o['date_text'] : '');

                    $stmtInsert->execute([$o['id'], $dText, $o['customer'], $o['address'], $o['phone'], $o['notes'], $o['status'], $itemsJson, $o['total'], $o['timestamp'], $uId]);
                } else {
                    $stmtUpdate->execute([$o['status'], $o['id']]);
                }
            }
            echo json_encode(["success" => true]);
        }
        // --- NUEVO BLOQUE PARA ELIMINAR ---
        elseif ($method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if($id) {
                $stmt = $conn->prepare("DELETE FROM orders WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["success" => true, "message" => "Pedido eliminado"]);
            } else {
                echo json_encode(["error" => "ID faltante"]);
            }
        }
    }

    // 4. USUARIOS
    elseif ($resource === 'usuarios') {
        if ($method === 'GET') {
            $stmt = $conn->prepare("SELECT * FROM users");
            $stmt->execute();
            echo json_encode(['users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($method === 'PUT' && isset($input['users'])) {
            $stmtCheck = $conn->prepare("SELECT id FROM users WHERE id = ?");
            $stmtInsert = $conn->prepare("INSERT INTO users (id, name, email, phone, address, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmtUpdate = $conn->prepare("UPDATE users SET name=?, phone=?, address=?, password=? WHERE id=?");

            foreach($input['users'] as $u) {
                $stmtCheck->execute([$u['id']]);
                if($stmtCheck->rowCount() == 0) {
                    $date = isset($u['createdAt']) ? $u['createdAt'] : date('Y-m-d H:i:s');
                    $stmtInsert->execute([$u['id'], $u['name'], $u['email'], $u['phone'], $u['address'], $u['password'], $date]);
                } else {
                    $stmtUpdate->execute([$u['name'], $u['phone'], $u['address'], $u['password'], $u['id']]);
                }
            }
            echo json_encode(["success" => true]);
        }
    }
?>