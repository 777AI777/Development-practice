class Item {
  final String id;
  final String itemName;
  final String description;
  final String? imageUrl;

  Item({
    required this.id,
    required this.itemName,
    required this.description,
    this.imageUrl,
  });

  Map<String, dynamic> toMap() {
    return {
      'itemName': itemName,
      'description': description,
      'imageUrl': imageUrl,
    };
  }

  factory Item.fromMap(String id, Map<String, dynamic> map) {
    return Item(
      id: id,
      itemName: map['itemName'] as String,
      description: map['description'] as String,
      imageUrl: map['imageUrl'] as String?,
    );
  }
}
