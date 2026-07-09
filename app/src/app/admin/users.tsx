import { useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { adminApi } from "../../services/api/admin";
import { Text } from "../../components/ui/Text";
import { spacing, radius } from "../../styles/tokens";

interface User {
  id: string; email: string; nome: string; tipo: number;
  plano: string; criado_em: string;
}

export default function AdminUsers() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const cardBg = theme.backgroundSecondary;

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTipo(user: User) {
    const novo = user.tipo === 1 ? 0 : 1;
    const acao = novo === 1 ? "promover a administrador" : "remover privilégios de admin";

    Alert.alert(
      "Confirmar",
      `Tens a certeza que queres ${acao} "${user.nome || user.email}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar", style: "destructive",
          onPress: async () => {
            try {
              setToggling(user.id);
              await adminApi.updateUserTipo(user.id, novo);
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, tipo: novo } : u));
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao atualizar");
            } finally { setToggling(null); }
          },
        },
      ]
    );
  }

  function confirmDelete(user: User) {
    Alert.alert(
      "Remover Utilizador",
      `Tens a certeza que queres remover "${user.nome || user.email}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover", style: "destructive",
          onPress: async () => {
            try {
              setToggling(user.id);
              await adminApi.deleteUser(user.id);
              setUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao remover");
            } finally { setToggling(null); }
          },
        },
      ]
    );
  }

  const renderUser = useCallback(({ item }: { item: User }) => {
    const isAdmin = item.tipo === 1;
    const isToggling = toggling === item.id;

    return (
      <View style={{ backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: theme.text, fontWeight: "600" }}>
              {item.nome || "Sem nome"}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
              {item.email}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
              <View style={{ backgroundColor: isAdmin ? "#FF3B3015" : theme.accent + "15", borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text variant="caption" style={{ color: isAdmin ? "#FF3B30" : theme.accent }}>
                  {isAdmin ? "Admin" : "Utilizador"}
                </Text>
              </View>
              {item.plano === "pago" && (
                <View style={{ backgroundColor: "#FFD60A15", borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text variant="caption" style={{ color: "#FFD60A" }}>Premium</Text>
                </View>
              )}
            </View>
          </View>

          {isToggling ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              <Pressable
                onPress={() => toggleTipo(item)}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isAdmin ? "#FF3B3015" : theme.accent + "15",
                  justifyContent: "center", alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name={isAdmin ? "shield-outline" : "shield-checkmark-outline"} size={18} color={isAdmin ? "#FF3B30" : theme.accent} />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item)}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: theme.danger + "15",
                  justifyContent: "center", alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }, [theme, toggling, cardBg]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text variant="title2" style={{ color: theme.text, fontWeight: "700", flex: 1 }}>
          Gerir Utilizadores
        </Text>
        <Pressable onPress={loadUsers}>
          <Ionicons name="refresh-outline" size={22} color={theme.accent} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="people-outline" size={40} color={theme.textSecondary} />
              <Text variant="body" style={{ color: theme.textSecondary, marginTop: spacing.sm }}>Nenhum utilizador encontrado</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
