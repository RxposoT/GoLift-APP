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
  id: string;
  email: string;
  nome: string;
  tipo: number;
  plano: string;
  criado_em: string;
}

export default function AdminUsers() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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

    Alert.alert("Confirmar", `Tens a certeza que queres ${acao} "${user.nome || user.email}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        style: "destructive",
        onPress: async () => {
          try {
            setToggling(user.id);
            await adminApi.updateUserTipo(user.id, novo);
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, tipo: novo } : u)));
          } catch (err: any) {
            Alert.alert("Erro", err.message || "Erro ao atualizar");
          } finally {
            setToggling(null);
          }
        },
      },
    ]);
  }

  function confirmDelete(user: User) {
    Alert.alert(
      "Remover Utilizador",
      `Tens a certeza que queres remover "${user.nome || user.email}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setToggling(user.id);
              await adminApi.deleteUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao remover");
            } finally {
              setToggling(null);
            }
          },
        },
      ]
    );
  }

  const renderUser = useCallback(
    ({ item }: { item: User }) => {
      const isAdmin = item.tipo === 1;
      const isToggling = toggling === item.id;
      const joined = item.criado_em
        ? new Date(item.criado_em).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })
        : "-";

      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.md,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isAdmin ? theme.accent + "18" : theme.backgroundSecondary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: spacing.sm,
            }}
          >
            <Ionicons name={isAdmin ? "shield-checkmark-outline" : "person-outline"} size={18} color={isAdmin ? theme.accent : theme.textTertiary} />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: theme.text, fontWeight: "500" }}>
              {item.nome || "Sem nome"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 2 }}>
              <Text variant="footnote" style={{ color: theme.textTertiary }}>
                {item.email}
              </Text>
              <Text variant="footnote" style={{ color: theme.textTertiary }}>
                ·
              </Text>
              <Text variant="footnote" style={{ color: theme.textTertiary }}>
                {joined}
              </Text>
              {item.plano === "pago" && (
                <>
                  <Text variant="footnote" style={{ color: theme.textTertiary }}>
                    ·
                  </Text>
                  <Ionicons name="diamond" size={12} color="#FFD60A" />
                </>
              )}
            </View>
          </View>

          {/* Actions */}
          {isToggling ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.xxs }}>
              <Pressable
                onPress={() => toggleTipo(item)}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Ionicons name="shield-outline" size={18} color={theme.textTertiary} />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item)}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Ionicons name="trash-outline" size={18} color={theme.textTertiary} />
              </Pressable>
            </View>
          )}
        </View>
      );
    },
    [theme, toggling]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xxl,
          paddingTop: spacing.xxl,
          paddingBottom: spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text variant="title2" style={{ color: theme.text, fontWeight: "700", letterSpacing: -0.3, flex: 1 }}>
          Utilizadores
        </Text>
        <Text variant="body" style={{ color: theme.textTertiary }}>
          {users.length}
        </Text>
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
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: spacing.xxl }} />
          )}
          contentContainerStyle={{ paddingBottom: spacing.huge }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="people-outline" size={40} color={theme.textTertiary} />
              <Text variant="body" style={{ color: theme.textTertiary, marginTop: spacing.sm }}>
                Nenhum utilizador encontrado
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}