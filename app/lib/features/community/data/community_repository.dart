import '../../../core/network/api_client.dart';
import '../models/post.dart';
import '../models/comment.dart';

class CommunityRepository {
  CommunityRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<List<String>> getCategories() async {
    final res = await _api.get<Map<String, dynamic>>('/posts/categories');
    final list = res.data?['categories'] as List? ?? [];
    return list.map((e) => e.toString()).toList();
  }

  Future<PostListResponse> getPosts({
    int page = 1,
    int limit = 20,
    String sort = 'latest',
    String? category,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sort': sort,
    };
    if (category != null && category.isNotEmpty) query['category'] = category;
    final res = await _api.get<Map<String, dynamic>>('/posts', queryParameters: query);
    return PostListResponse.fromJson(res.data ?? {});
  }

  Future<Post> getPost(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/posts/$id');
    return Post.fromJson(res.data ?? {});
  }

  Future<Post> createPost({
    required String title,
    required String content,
    required String category,
    List<String>? imageUrls,
    String? videoUrl,
  }) async {
    final data = <String, dynamic>{
      'title': title,
      'content': content,
      'category': category,
    };
    if (imageUrls != null && imageUrls.isNotEmpty) data['imageUrls'] = imageUrls;
    if (videoUrl != null && videoUrl.isNotEmpty) data['videoUrl'] = videoUrl;
    final res = await _api.post<Map<String, dynamic>>('/posts', data: data);
    return Post.fromJson(res.data ?? {});
  }

  Future<Post> updatePost({
    required String id,
    String? title,
    String? content,
    String? category,
    List<String>? imageUrls,
    String? videoUrl,
  }) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (content != null) data['content'] = content;
    if (category != null) data['category'] = category;
    if (imageUrls != null) data['imageUrls'] = imageUrls;
    if (videoUrl != null && videoUrl.isNotEmpty) data['videoUrl'] = videoUrl;
    final res = await _api.patch<Map<String, dynamic>>('/posts/$id', data: data);
    return Post.fromJson(res.data ?? {});
  }

  Future<void> deletePost(String id) async {
    await _api.delete('/posts/$id');
  }

  Future<Map<String, bool>> toggleLike(String postId) async {
    final res = await _api.post<Map<String, dynamic>>('/posts/$postId/like');
    final liked = res.data?['liked'] as bool? ?? false;
    return {'liked': liked};
  }

  Future<bool> isLiked(String postId) async {
    final res = await _api.get<Map<String, dynamic>>('/posts/$postId/like');
    return res.data?['liked'] as bool? ?? false;
  }

  Future<CommentListResponse> getComments(String postId, {int page = 1, int limit = 50}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/posts/$postId/comments',
      queryParameters: {'page': page, 'limit': limit},
    );
    return CommentListResponse.fromJson(res.data ?? {});
  }

  Future<Comment> createComment(String postId, String content) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/posts/$postId/comments',
      data: {'content': content},
    );
    return Comment.fromJson(res.data ?? {});
  }

  Future<void> deleteComment(String commentId) async {
    await _api.delete('/posts/comments/$commentId');
  }

  Future<PostListResponse> getMyPosts({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/posts/me',
      queryParameters: {'page': page, 'limit': limit},
    );
    return PostListResponse.fromJson(res.data ?? {});
  }
}
