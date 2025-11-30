import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uchi_no_manual/models/item.dart';

class FirestoreService {
  final CollectionReference _itemsCollection = FirebaseFirestore.instance.collection('items');

  Future<void> addItem(Item item) {
    return _itemsCollection.add(item.toMap());
  }

  Stream<List<Item>> getItems() {
    return _itemsCollection.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>?;
        if (data == null) {
          throw Exception("Document data was null!");
        }
        return Item.fromMap(doc.id, data);
      }).toList();
    });
  }
}
