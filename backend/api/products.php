<?php
ob_start();
// backend/api/products.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
ob_clean();

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':   getProducts();                    break;
    case 'get':    getProduct((int)($_GET['id']??0)); break;
    case 'create': requireAdmin(); createProduct();  break;
    case 'update': requireAdmin(); updateProduct((int)($_GET['id']??0)); break;
    case 'delete': requireAdmin(); deleteProduct((int)($_GET['id']??0)); break;
    default: echo json_encode(['success'=>false,'message'=>'Action không hợp lệ']);
}

/* ── Ép kiểu đúng cho 1 product row ─────────────────────────────────────── */
function castProduct($row) {
    $row['id']        = (int)$row['id'];
    $row['price']     = (int)$row['price'];
    $row['eco_score'] = (int)$row['eco_score'];
    $row['stock']     = (int)$row['stock'];
    $row['active']    = (int)$row['active'];
    return $row;
}

function getProducts() {
    $db       = getDB();
    $category = trim($_GET['category'] ?? '');
    $sql      = "SELECT * FROM products WHERE active = 1";

    if ($category && $category !== 'all') {
        $stmt = $db->prepare($sql . " AND category = ? ORDER BY id ASC");
        $stmt->bind_param('s', $category);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $db->query($sql . " ORDER BY id ASC");
    }

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = castProduct($row);
    }
    echo json_encode(['success' => true, 'data' => $products], JSON_UNESCAPED_UNICODE);
}

function getProduct($id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ? AND active = 1");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) {
        echo json_encode(['success' => true, 'data' => castProduct($row)], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => 'Sản phẩm không tồn tại']);
    }
}

function createProduct() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) { echo json_encode(['success'=>false,'message'=>'Dữ liệu không hợp lệ']); return; }

    $db    = getDB();
    $name  = trim($data['name']        ?? '');
    $cat   = trim($data['category']    ?? '');
    $price = (int)($data['price']      ?? 0);
    $unit  = trim($data['unit']        ?? '');
    $eco   = (int)($data['eco_score']  ?? 95);
    $ing   = trim($data['ingredient']  ?? '');
    $icon  = trim($data['icon']        ?? 'fas fa-file-alt');
    $img   = trim($data['img_class']   ?? 'img-1');
    $badge = trim($data['badge']       ?? '');
    $desc  = trim($data['description'] ?? '');
    $stock = (int)($data['stock']      ?? 100);

    if (!$name || !$cat || !$price) {
        echo json_encode(['success'=>false,'message'=>'Thiếu thông tin bắt buộc']); return;
    }

    $stmt = $db->prepare("INSERT INTO products (name,category,price,unit,eco_score,ingredient,icon,img_class,badge,description,stock) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param('ssisssssssi', $name,$cat,$price,$unit,$eco,$ing,$icon,$img,$badge,$desc,$stock);

    if ($stmt->execute()) {
        echo json_encode(['success'=>true,'id'=>$db->insert_id,'message'=>'Thêm sản phẩm thành công']);
    } else {
        echo json_encode(['success'=>false,'message'=>'Lỗi: '.$db->error]);
    }
}

function updateProduct($id) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !$id) { echo json_encode(['success'=>false,'message'=>'Dữ liệu không hợp lệ']); return; }

    $db      = getDB();
    $fields  = [];
    $types   = '';
    $values  = [];
    $intCols = ['price','eco_score','stock','active'];
    $allowed = ['name','category','price','unit','eco_score','ingredient','icon','img_class','badge','description','stock','active'];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $data)) {
            $fields[] = "`$f` = ?";
            $types   .= in_array($f, $intCols) ? 'i' : 's';
            $values[] = in_array($f, $intCols) ? (int)$data[$f] : $data[$f];
        }
    }
    if (empty($fields)) { echo json_encode(['success'=>false,'message'=>'Không có dữ liệu']); return; }

    $values[] = $id;
    $types   .= 'i';
    $stmt = $db->prepare("UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->bind_param($types, ...$values);

    if ($stmt->execute()) {
        echo json_encode(['success'=>true,'message'=>'Cập nhật thành công']);
    } else {
        echo json_encode(['success'=>false,'message'=>'Lỗi: '.$db->error]);
    }
}

function deleteProduct($id) {
    $db   = getDB();
    $stmt = $db->prepare("UPDATE products SET active = 0 WHERE id = ?");
    $stmt->bind_param('i', $id);
    echo $stmt->execute()
        ? json_encode(['success'=>true,'message'=>'Đã xóa sản phẩm'])
        : json_encode(['success'=>false,'message'=>'Lỗi: '.$db->error]);
}
