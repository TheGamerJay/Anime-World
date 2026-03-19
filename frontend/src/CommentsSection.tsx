import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from './theme';
import { commentAPI } from './api';
import { useAuth } from './AuthContext';

interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_color: string;
  text: string;
  like_count: number;
  created_at: string;
  replies?: Comment[];
  reply_count?: number;
}

interface CommentsSectionProps {
  contentType: 'series' | 'episode';
  contentId: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function CommentItem({ comment, onLike, onReply, onDelete, currentUserId }: {
  comment: Comment;
  onLike: (id: string) => void;
  onReply: (id: string, username: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const initial = comment.username.charAt(0).toUpperCase();

  return (
    <View style={styles.commentItem}>
      <LinearGradient colors={[comment.avatar_color, comment.avatar_color + '60']} style={styles.avatar}>
        <View style={styles.avatarInner}>
          <Text style={[styles.avatarLetter, { color: comment.avatar_color }]}>{initial}</Text>
        </View>
      </LinearGradient>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{comment.username}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity onPress={() => onLike(comment.id)} style={styles.actionBtn}>
            <Ionicons name="heart-outline" size={16} color={Colors.text.muted} />
            <Text style={styles.actionText}>{comment.like_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onReply(comment.id, comment.username)} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.text.muted} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {currentUserId === comment.user_id && (
            <TouchableOpacity onPress={() => onDelete(comment.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.brand.error} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Replies */}
        {(comment.reply_count || 0) > 0 && (
          <TouchableOpacity onPress={() => setShowReplies(!showReplies)} style={styles.showRepliesBtn}>
            <Text style={styles.showRepliesText}>
              {showReplies ? 'Hide' : 'View'} {comment.reply_count} repl{comment.reply_count === 1 ? 'y' : 'ies'}
            </Text>
          </TouchableOpacity>
        )}
        {showReplies && comment.replies?.map((reply) => (
          <View key={reply.id} style={styles.replyItem}>
            <Text style={styles.replyUsername}>@{reply.username}</Text>
            <Text style={styles.replyText}>{reply.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CommentsSection({ contentType, contentId }: CommentsSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  const loadComments = useCallback(async () => {
    try {
      const res = await commentAPI.getComments(contentType, contentId);
      setComments(res.comments || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await commentAPI.create({
        content_type: contentType,
        content_id: contentId,
        text: newComment.trim(),
        parent_id: replyingTo?.id,
      });
      setNewComment('');
      setReplyingTo(null);
      loadComments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      await commentAPI.like(commentId);
      loadComments();
    } catch {}
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await commentAPI.delete(commentId);
            loadComments();
          } catch {}
        },
      },
    ]);
  };

  const handleReply = (id: string, username: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setReplyingTo({ id, username });
    setNewComment(`@${username} `);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>💬 Comments ({total})</Text>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>Replying to @{replyingTo.username}</Text>
            <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
              <Ionicons name="close" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            placeholderTextColor={Colors.text.muted}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!!user}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !newComment.trim()}
            style={[styles.sendBtn, (!newComment.trim() || submitting) && styles.sendBtnDisabled]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="send" size={18} color={newComment.trim() ? '#000' : Colors.text.muted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments List */}
      {loading ? (
        <ActivityIndicator size="small" color={Colors.brand.cyan} style={{ marginTop: 20 }} />
      ) : comments.length === 0 ? (
        <View style={styles.emptyComments}>
          <Ionicons name="chatbubble-outline" size={32} color={Colors.text.muted} />
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        </View>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={handleLike}
            onReply={handleReply}
            onDelete={handleDelete}
            currentUserId={user?.id}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },
  inputContainer: { marginBottom: Spacing.md },
  replyingTo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.brand.cyanDim, padding: 8, borderRadius: Radius.sm, marginBottom: 8,
  },
  replyingToText: { color: Colors.brand.cyan, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, padding: 12,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text.primary, fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.cyan,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.bg.surface },
  emptyComments: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.text.muted, fontSize: 14 },
  // Comment Item
  commentItem: { flexDirection: 'row', marginBottom: Spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, padding: 2, marginRight: 10 },
  avatarInner: { flex: 1, borderRadius: 16, backgroundColor: Colors.bg.default, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 14, fontWeight: '800' },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentUsername: { color: Colors.text.primary, fontSize: 13, fontWeight: '700' },
  commentTime: { color: Colors.text.muted, fontSize: 11 },
  commentText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: Colors.text.muted, fontSize: 12 },
  showRepliesBtn: { marginTop: 8 },
  showRepliesText: { color: Colors.brand.cyan, fontSize: 12, fontWeight: '600' },
  replyItem: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.border },
  replyUsername: { color: Colors.brand.cyan, fontSize: 12, fontWeight: '600' },
  replyText: { color: Colors.text.muted, fontSize: 13 },
});
