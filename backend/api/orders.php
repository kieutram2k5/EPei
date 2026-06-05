<?php
/**
 * EPei - backend/api/orders.php
 * Không dùng bind_param cho INSERT orders (tránh lỗi type 'l' PHP 8)
 * Dùng real_escape_string + query trực tiếp
 */
// Bắt tất cả output để tránh PHP warning làm hỏng JSON
ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';

// Xóa bất kỳ output nào trước đó (PHP warnings, notices)
ob_clean();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create':        createOrder();                     break;
    case 'list':          requireAdmin(); listOrders();      break;
    case 'my':            $u = requireAuth(); myOrders($u);  break;
    case 'get':           getOrder($_GET['id'] ?? '');       break;
    case 'update_status': requireAdmin(); updateStatus($_GET['id'] ?? ''); break;
    default:
        echo json_encode(['success' => false, 'message' => 'Action không hợp lệ']);
}

/* ─────────────────────────────────────────────────────────────────────────────
   TẠO ĐƠN HÀNG
───────────────────────────────────────────────────────────────────────────── */
function createOrder() {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ']);
        return;
    }

    // Lấy và validate dữ liệu
    $name    = trim($data['customer_name']    ?? '');
    $phone   = trim($data['customer_phone']   ?? '');
    $address = trim($data['customer_address'] ?? '');
    $email   = trim($data['customer_email']   ?? '');
    $note    = trim($data['note']             ?? '');
    $payment = trim($data['payment_method']   ?? 'cod');
    $items   = $data['items'] ?? [];

    if (!$name)        { echo json_encode(['success' => false, 'message' => 'Vui lòng nhập họ tên']); return; }
    if (!$phone)       { echo json_encode(['success' => false, 'message' => 'Vui lòng nhập số điện thoại']); return; }
    if (!$address)     { echo json_encode(['success' => false, 'message' => 'Vui lòng nhập địa chỉ giao hàng']); return; }
    if (empty($items)) { echo json_encode(['success' => false, 'message' => 'Giỏ hàng trống']); return; }

    $db = getDB();

    // Xác minh sản phẩm từ DB và tính tổng tiền
    $total     = 0;
    $itemsData = [];

    foreach ($items as $item) {
        $pid = (int)($item['id']  ?? 0);
        $qty = max(1, (int)($item['qty'] ?? 1));
        if ($pid <= 0) continue;

        $r = $db->query("SELECT id, name, price FROM products WHERE id = $pid AND active = 1");
        if (!$r) continue;
        $p = $r->fetch_assoc();
        if (!$p) continue;

        $pr      = (int)$p['price'];
        $sub     = $pr * $qty;
        $total  += $sub;
        $itemsData[] = [
            'pid'   => $pid,
            'pname' => $p['name'],
            'price' => $pr,
            'qty'   => $qty,
            'sub'   => $sub,
        ];
    }

    if (empty($itemsData)) {
        echo json_encode(['success' => false, 'message' => 'Không có sản phẩm hợp lệ trong giỏ hàng']);
        return;
    }

    // Tạo mã đơn hàng
    $orderId = 'EPei-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    $total   = (int)$total;

    // Lấy user_id nếu đã đăng nhập
    $me     = getCurrentUser();
    $userId = $me ? (int)$me['id'] : 0;

    // Escape tất cả string values
    $oid  = $db->real_escape_string($orderId);
    $nm   = $db->real_escape_string($name);
    $ph   = $db->real_escape_string($phone);
    $em   = $db->real_escape_string($email);
    $ad   = $db->real_escape_string($address);
    $nt   = $db->real_escape_string($note);
    $pay  = $db->real_escape_string($payment);

    // INSERT order
    if ($userId > 0) {
        $sql = "INSERT INTO orders
                    (id, user_id, customer_name, customer_phone, customer_email,
                     customer_address, note, payment_method, total)
                VALUES
                    ('$oid', $userId, '$nm', '$ph', '$em', '$ad', '$nt', '$pay', $total)";
    } else {
        $sql = "INSERT INTO orders
                    (id, customer_name, customer_phone, customer_email,
                     customer_address, note, payment_method, total)
                VALUES
                    ('$oid', '$nm', '$ph', '$em', '$ad', '$nt', '$pay', $total)";
    }

    if (!$db->query($sql)) {
        echo json_encode(['success' => false, 'message' => 'Lỗi tạo đơn hàng: ' . $db->error]);
        return;
    }

    // INSERT order_items
    foreach ($itemsData as $item) {
        $pn  = $db->real_escape_string($item['pname']);
        $pid = (int)$item['pid'];
        $pr  = (int)$item['price'];
        $qty = (int)$item['qty'];
        $sub = (int)$item['sub'];
        $db->query("INSERT INTO order_items
                        (order_id, product_id, product_name, price, quantity, subtotal)
                    VALUES
                        ('$oid', $pid, '$pn', $pr, $qty, $sub)");
    }

    echo json_encode([
        'success'  => true,
        'order_id' => $orderId,
        'total'    => $total,
        'message'  => 'Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận trong 24 giờ.',
    ], JSON_UNESCAPED_UNICODE);
}

/* ─────────────────────────────────────────────────────────────────────────────
   DANH SÁCH ĐƠN HÀNG (Admin)
───────────────────────────────────────────────────────────────────────────── */
function listOrders() {
    $db     = getDB();
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? '');

    $where = '1=1';
    if ($search) {
        $s      = $db->real_escape_string($search);
        $where .= " AND (o.id LIKE '%$s%' OR o.customer_name LIKE '%$s%' OR o.customer_phone LIKE '%$s%')";
    }
    if ($status) {
        $st     = $db->real_escape_string($status);
        $where .= " AND o.order_status = '$st'";
    }

    $sql    = "SELECT o.*, COUNT(oi.id) as item_count
               FROM orders o
               LEFT JOIN order_items oi ON o.id = oi.order_id
               WHERE $where
               GROUP BY o.id
               ORDER BY o.created_at DESC";

    $result = $db->query($sql);
    $orders = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $row['total']      = (int)$row['total'];
            $row['item_count'] = (int)($row['item_count'] ?? 0);
            $orders[] = $row;
        }
    }
    echo json_encode(['success' => true, 'data' => $orders], JSON_UNESCAPED_UNICODE);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ĐƠN HÀNG CỦA TÔI (Customer)
───────────────────────────────────────────────────────────────────────────── */
function myOrders($user) {
    $db  = getDB();
    $uid = (int)$user['id'];

    $result = $db->query("SELECT o.*, COUNT(oi.id) as item_count
                          FROM orders o
                          LEFT JOIN order_items oi ON o.id = oi.order_id
                          WHERE o.user_id = $uid
                          GROUP BY o.id
                          ORDER BY o.created_at DESC");
    $orders = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $row['total']      = (int)$row['total'];
            $row['item_count'] = (int)($row['item_count'] ?? 0);
            $orders[] = $row;
        }
    }
    echo json_encode(['success' => true, 'data' => $orders], JSON_UNESCAPED_UNICODE);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHI TIẾT ĐƠN HÀNG
───────────────────────────────────────────────────────────────────────────── */
function getOrder($id) {
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Thiếu ID đơn hàng']);
        return;
    }
    $db  = getDB();
    $eid = $db->real_escape_string($id);

    $r     = $db->query("SELECT * FROM orders WHERE id = '$eid'");
    $order = $r ? $r->fetch_assoc() : null;

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy đơn hàng']);
        return;
    }

    $ri             = $db->query("SELECT * FROM order_items WHERE order_id = '$eid'");
    $order['items'] = $ri ? $ri->fetch_all(MYSQLI_ASSOC) : [];
    $order['total'] = (int)$order['total'];

    echo json_encode(['success' => true, 'data' => $order], JSON_UNESCAPED_UNICODE);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CẬP NHẬT TRẠNG THÁI (Admin)
───────────────────────────────────────────────────────────────────────────── */
function updateStatus($id) {
    $data    = json_decode(file_get_contents('php://input'), true);
    $status  = $data['status'] ?? '';
    $allowed = ['pending', 'confirmed', 'shipping', 'done', 'cancelled'];

    if (!in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Trạng thái không hợp lệ']);
        return;
    }

    $db  = getDB();
    $eid = $db->real_escape_string($id);
    $est = $db->real_escape_string($status);

    if ($db->query("UPDATE orders SET order_status = '$est' WHERE id = '$eid'")) {
        echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $db->error]);
    }
}
