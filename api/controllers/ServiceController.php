<?php
class ServiceController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // GET /services or /admin/services — All services ordered by index
    public function index() {
        $stmt     = $this->db->query("SELECT id, title, description, image_url, order_index FROM services ORDER BY order_index ASC");
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse($services);
    }

    // PUT /admin/services/{id} — Update title, description, image_url
    public function update($id, $data) {
        if (empty($data['title'])) {
            jsonResponse(['error' => 'Title is required'], 422);
            return;
        }

        // Accept the uploaded relative path as-is (e.g. "images/photo_abc123.jpg")
        // image_url column is longtext — no truncation needed
        $imageUrl = trim($data['image_url'] ?? '');

        // Safety: reject raw base64 blobs (shouldn't happen anymore with server upload)
        if (str_starts_with($imageUrl, 'data:')) {
            jsonResponse(['error' => 'Do not send base64. Upload the file via /api/upload.php first.'], 422);
            return;
        }

        $sql  = "UPDATE services SET title = :title, description = :description, image_url = :image_url WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':title'       => trim($data['title']),
            ':description' => trim($data['description'] ?? ''),
            ':image_url'   => $imageUrl,
            ':id'          => (int)$id
        ]);

        jsonResponse(['message' => 'Service updated', 'id' => (int)$id, 'image_url' => $imageUrl]);
    }
}
?>
