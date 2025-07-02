import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCreateConversationMutation, User } from '@/store/api/messagingApi';
import { useAuth } from '@/hooks/useAuth';

// Mock users data - in real app, this would come from an API
const MOCK_USERS: User[] = [
  {
    id: '1',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    role: 'PRACTITIONER',
  },
  {
    id: '2',
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    role: 'PRACTITIONER',
  },
  {
    id: '3',
    firstName: 'Support',
    lastName: 'Team',
    email: 'support@example.com',
    role: 'ADMIN',
  },
];

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatType, setChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [groupTitle, setGroupTitle] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const [createConversation, { isLoading: creating }] =
    useCreateConversationMutation();

  useEffect(() => {
    // Filter out current user and apply search
    const filteredUsers = MOCK_USERS.filter(
      (u) =>
        u.id !== user?.id &&
        (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setUsers(filteredUsers);
  }, [searchQuery, user?.id]);

  const handleUserSelect = (selectedUser: User) => {
    if (chatType === 'DIRECT') {
      // For direct chat, replace selection
      setSelectedUsers([selectedUser]);
    } else {
      // For group chat, toggle selection
      setSelectedUsers((prev) => {
        const isSelected = prev.some((u) => u.id === selectedUser.id);
        if (isSelected) {
          return prev.filter((u) => u.id !== selectedUser.id);
        } else {
          return [...prev, selectedUser];
        }
      });
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    if (chatType === 'GROUP' && !groupTitle.trim()) {
      Alert.alert('Error', 'Please enter a group title');
      return;
    }

    try {
      const memberIds = [user!.id, ...selectedUsers.map((u) => u.id)];

      const result = await createConversation({
        type: chatType,
        title: chatType === 'GROUP' ? groupTitle.trim() : undefined,
        memberIds,
      }).unwrap();

      router.replace(`../chat/${result.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create conversation');
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{item.firstName.charAt(0)}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userRole}>
            {item.role.toLowerCase().replace('_', ' ')}
          </Text>
        </View>

        {isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={24} color="#9C27B0" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#9C27B0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Chat</Text>

        <TouchableOpacity
          style={[
            styles.createButton,
            (selectedUsers.length === 0 || creating) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateChat}
          disabled={selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Chat Type Selection */}
        <View style={styles.chatTypeContainer}>
          <TouchableOpacity
            style={[
              styles.chatTypeButton,
              chatType === 'DIRECT' && styles.activeChatType,
            ]}
            onPress={() => {
              setChatType('DIRECT');
              setSelectedUsers((prev) => prev.slice(0, 1)); // Keep only first user
            }}
          >
            <Text
              style={[
                styles.chatTypeText,
                chatType === 'DIRECT' && styles.activeChatTypeText,
              ]}
            >
              Direct
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chatTypeButton,
              chatType === 'GROUP' && styles.activeChatType,
            ]}
            onPress={() => setChatType('GROUP')}
          >
            <Text
              style={[
                styles.chatTypeText,
                chatType === 'GROUP' && styles.activeChatTypeText,
              ]}
            >
              Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Title Input */}
        {chatType === 'GROUP' && (
          <View style={styles.groupTitleContainer}>
            <TextInput
              style={styles.groupTitleInput}
              placeholder="Group title"
              value={groupTitle}
              onChangeText={setGroupTitle}
              maxLength={100}
            />
          </View>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersContainer}>
            <Text style={styles.selectedUsersTitle}>Selected:</Text>
            <View style={styles.selectedUsersList}>
              {selectedUsers.map((user) => (
                <View key={user.id} style={styles.selectedUserChip}>
                  <Text style={styles.selectedUserName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedUsers((prev) =>
                        prev.filter((u) => u.id !== user.id)
                      )
                    }
                  >
                    <IconSymbol name="xmark" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Users List */}
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          style={styles.usersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No users found' : 'No users available'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  createButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  chatTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  chatTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeChatType: {
    backgroundColor: '#9C27B0',
  },
  chatTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeChatTypeText: {
    color: '#fff',
  },
  groupTitleContainer: {
    marginBottom: 16,
  },
  groupTitleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#000',
  },
  selectedUsersContainer: {
    marginBottom: 16,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedUserName: {
    color: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedUserItem: {
    borderColor: '#9C27B0',
    backgroundColor: '#f8f0ff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});
