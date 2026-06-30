import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { workoutApi, exerciseApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { WorkoutsScreenSkeleton } from "../../components/ui/SkeletonLoader";

export default function Workouts() {
  const { user } = useAuth();
  const theme = useTheme();
  const { paddingTop: safeTop, paddingBottom: safeBottom } = useAndroidInsets();
  const { userCommunities, sendMessage } = useCommunities();
  const [refreshing, setRefreshing] = useState(false);
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);

  // Partilha de treino
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareWorkoutData, setShareWorkoutData] = useState<any>(null);
  const [sharingToComm, setSharingToComm] = useState(false);
  const [copyingWorkout, setCopyingWorkout] = useState(false);
  // Copiar treino para lista do usuário
  async function copyWorkoutToUserList() {
    if (!shareWorkoutData) return;
    setCopyingWorkout(true);
    try {
      // Buscar exercícios do treino
      const resp = await workoutApi.getWorkoutExercises(shareWorkoutData.id_treino).catch(() => ({ exercicios: [] }));
      const exerciseIds = (resp?.exercicios || []).map((ex: any) => ex.id_exercicio);
      // Verificar se já existe um treino com o mesmo nome
      const exists = myWorkouts.some((w: any) => w.nome === shareWorkoutData.nome);
      let newName = shareWorkoutData.nome;
      if (exists) {
        // Adicionar sufixo para evitar duplicatas
        newName = `${shareWorkoutData.nome} (Cópia)`;
      }
      await workoutApi.createWorkout(user!.id, newName, exerciseIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Treino copiado para sua lista!");
      setShowShareModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao copiar treino");
    } finally {
      setCopyingWorkout(false);
    }
  }

  // Modal criar / editar treino
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null); // null = criar, objeto = editar
  const [workoutName, setWorkoutName] = useState("");
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [modalFilterBodyPart, setModalFilterBodyPart] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const userWorkouts = await workoutApi.getUserWorkouts(user!.id).catch(() => []);
      
      // Remover duplicatas usando Set com nome do treino como chave
      const uniqueWorkouts = Array.from(
        new Map(
          (userWorkouts || []).map((w) => [w.nome + w.id_treino, w])
        ).values()
      );
      
      setMyWorkouts(uniqueWorkouts);
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function openCreateModal() {
    setEditingWorkout(null);
    setShowCreateModal(true);
    setWorkoutName("");
    setSelectedExercises([]);
    setModalFilterBodyPart(null);
    setLoadingExercises(true);
    try {
      const exercises = await exerciseApi.getAll();
      setAvailableExercises(exercises || []);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoadingExercises(false);
    }
  }

  async function openEditModal(workout: any) {
    setEditingWorkout(workout);
    setShowCreateModal(true);
    setWorkoutName(workout.nome);
    setSelectedExercises([]);
    setModalFilterBodyPart(null);
    setLoadingExercises(true);
    try {
      const [exercises, workoutExs] = await Promise.all([
        exerciseApi.getAll(),
        workoutApi.getWorkoutExercises(workout.id_treino).catch(() => ({ exercicios: [] })),
      ]);
      const allExs = exercises || [];
      setAvailableExercises(allExs);
      // Pré-selecionar os exercícios atuais do treino
      const currentIds = new Set((workoutExs?.exercicios || []).map((e: any) => e.id_exercicio));
      const preSelected = allExs.filter((e: any) => currentIds.has(e.id));
      setSelectedExercises(preSelected);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoadingExercises(false);
    }
  }

  function toggleExercise(exercise: any) {
    if (selectedExercises.find((e: any) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e: any) => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  }

  async function handleCreateWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Erro", "Insere um nome para o treino");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Erro", "Seleciona pelo menos um exercício");
      return;
    }

    // Verificar se treino com este nome já existe
    const treinoExistente = myWorkouts.find(
      (w: any) => w.nome.toLowerCase() === workoutName.trim().toLowerCase()
    );
    if (treinoExistente) {
      Alert.alert("Treino Duplicado", `Já existe um treino chamado "${workoutName}". Escolhe um nome diferente.`);
      return;
    }

    setSavingWorkout(true);
    try {
      const exerciseIds = selectedExercises.map((e: any) => e.id);
      const upperName = workoutName.charAt(0).toUpperCase() + workoutName.slice(1);
      await workoutApi.createWorkout(user!.id, upperName, exerciseIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Treino criado com sucesso!");
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar treino");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleUpdateWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Erro", "Insere um nome para o treino");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Erro", "Seleciona pelo menos um exercício");
      return;
    }
    setSavingWorkout(true);
    try {
      const exerciseIds = selectedExercises.map((e: any) => e.id);
      const upperName = workoutName.charAt(0).toUpperCase() + workoutName.slice(1);
      await workoutApi.updateWorkout(user!.id, editingWorkout.id_treino, upperName, exerciseIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Guardado!", "Treino atualizado com sucesso.");
      setShowCreateModal(false);
      setEditingWorkout(null);
      loadData();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar treino");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleStartWorkout(workout: any) {
    Alert.alert(
      "Começar Treino",
      `Deseja começar: ${workout.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          style: "default",
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/workout/${workout.id_treino}`);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível iniciar o treino");
            }
          },
        },
      ]
    );
  }

  async function handleDeleteWorkout(workout: any) {
    Alert.alert(
      "Apagar Treino",
      `Tens a certeza que queres apagar "${workout.nome}"? O histórico de sessões também será apagado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await workoutApi.deleteWorkout(user!.id, workout.id_treino);
              loadData();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível apagar o treino");
            }
          },
        },
      ]
    );
  }

  function handleShareTemplate(workout: any) {
    if (userCommunities.length === 0) {
      Alert.alert("Sem comunidades", "Entra numa comunidade para poderes partilhar treinos.");
      return;
    }
    setShareWorkoutData(workout);
    setShowShareModal(true);
  }

  async function sendShareToCommunity(community: any) {
    if (!shareWorkoutData || sharingToComm) return;
    setSharingToComm(true);
    try {
      const resp = await workoutApi.getWorkoutExercises(shareWorkoutData.id_treino).catch(() => ({ exercicios: [] }));
      const exercicios = (resp?.exercicios || []).map((ex: any) => ({
        id: ex.id_exercicio,
        nome: ex.nome,
        grupo_tipo: ex.grupo_tipo || null,
      }));
      const payload = JSON.stringify({
        tipo: "template",
        nome: shareWorkoutData.nome,
        exercicios,
      });
      await sendMessage(community.id, `__SHARE__${payload}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowShareModal(false);
      Alert.alert("Partilhado!", `Treino enviado para ${community.nome}`);
    } catch {
      Alert.alert("Erro", "Não foi possível partilhar o treino");
    } finally {
      setSharingToComm(false);
    }
  }

  if (loading) {
    return <WorkoutsScreenSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 12, paddingBottom: 16 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>
            Treinos
          </Text>
        </View>

        {/* Meus Treinos */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
              Os Meus Treinos
            </Text>
            <TouchableOpacity
              onPress={openCreateModal}
              style={{
                backgroundColor: theme.accent,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "600", marginLeft: 6, fontSize: 14 }}>
                Novo
              </Text>
            </TouchableOpacity>
          </View>

          {myWorkouts.length === 0 ? (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, paddingVertical: 44, paddingHorizontal: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>≡ƒÅï∩╕Å</Text>
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.3 }}>Sem treinos ainda</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" }}>Cria o teu primeiro treino personalizado</Text>
              <Pressable
                onPress={openCreateModal}
                accessibilityLabel="Criar treino"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  marginTop: 20,
                  backgroundColor: theme.accent,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 14,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Criar Treino</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {myWorkouts.map((workout: any, index: number) => (
                <Pressable
                  key={workout.id_treino || index}
                  onPress={() => handleStartWorkout(workout)}
                  accessibilityLabel={`Come├ºar treino ${workout.nome}`}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    backgroundColor: theme.backgroundSecondary,
                    borderRadius: 20,
                    overflow: "hidden",
                    flexDirection: "row",
                    opacity: pressed ? 0.88 : 1,
                  })}
                >
                  {/* Stripe lateral */}
                  <View style={{ width: 4, backgroundColor: workout.is_ia ? "#f59e0b" : theme.accent }} />

                  <View style={{ flex: 1, padding: 18 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, letterSpacing: -0.3 }}>
                          {workout.nome}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
                          {workout.num_exercicios ?? 0} exercícios
                          {workout.is_ia && (
                            <Text style={{ color: "#f59e0b" }}> IA </Text>
                          )}
                        </Text>
                      </View>

                      {/* A├º├╡es */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {!workout.is_ia && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); handleShareTemplate(workout); }}
                            style={{ padding: 10 }}
                            accessibilityLabel="Partilhar treino"
                          >
                            <Ionicons name="share-social-outline" size={19} color={theme.textSecondary} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); openEditModal(workout); }}
                          style={{ padding: 10 }}
                          accessibilityLabel="Editar treino"
                        >
                          <Ionicons name="create-outline" size={19} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); handleDeleteWorkout(workout); }}
                          style={{ padding: 10 }}
                          accessibilityLabel="Apagar treino"
                        >
                          <Ionicons name="trash-outline" size={19} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Botão play */}
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: workout.is_ia ? "#f59e0b" : theme.accent, justifyContent: "center", alignItems: "center", marginLeft: 4 }}>
                          <Ionicons name="play" size={18} color="#fff" />
                        </View>
                      </View>
                    </View>

                    {/* Exerc├¡cios preview */}
                    {workout.exercicios?.length > 0 && (
                      <View style={{ marginTop: 12, gap: 4 }}>
                        {workout.exercicios.slice(0, 3).map((ex: any, i: number) => (
                          <Text key={i} style={{ fontSize: 12, color: theme.textSecondary }}>
                            ┬╖ {ex.nome || ex.name}
                          </Text>
                        ))}
                        {workout.exercicios.length > 3 && (
                          <Text style={{ fontSize: 12, color: theme.textTertiary }}>
                            +{workout.exercicios.length - 3} mais...
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Criar Treino */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowCreateModal(false); setEditingWorkout(null); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "90%",
            }}
          >
            {/* Header Modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}>
                {editingWorkout ? "Editar Treino" : "Criar Treino"}
              </Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setEditingWorkout(null); }}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingTop: 24 }}>
              {/* Nome do treino */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500", fontSize: 14 }}>
                  Nome do Treino
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: theme.text,
                    fontSize: 16,
                  }}
                  placeholder="Ex: Treino de Peito"
                  placeholderTextColor={theme.textSecondary}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              {/* Exercicios selecionados */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500", fontSize: 14 }}>
                  Exercicios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View
                    style={{
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.accent,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      marginBottom: 16,
                    }}
                  >
                    {selectedExercises.map((ex: any, i: number) => (
                      <View
                        key={ex.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 8,
                          borderBottomColor: theme.border,
                          borderBottomWidth: i < selectedExercises.length - 1 ? 1 : 0,
                        }}
                      >
                        <Text style={{ color: theme.text, fontSize: 14 }}>
                          {ex.nome}
                        </Text>
                        <TouchableOpacity onPress={() => toggleExercise(ex)}>
                          <Ionicons name="close-circle" size={20} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Lista de exercicios disponiveis */}
              <Text style={{ color: theme.text, marginBottom: 12, fontWeight: "500", fontSize: 14 }}>
                Adicionar Exercicios
              </Text>

              {/* Carrossel de Filtro de Body Parts */}
              {!loadingExercises && availableExercises.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <TouchableOpacity
                      onPress={() => setModalFilterBodyPart(null)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor:
                          modalFilterBodyPart === null ? theme.accent : theme.backgroundSecondary,
                        borderColor: modalFilterBodyPart === null ? theme.accent : theme.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        style={{
                          color: modalFilterBodyPart === null ? "white" : theme.textSecondary,
                          fontWeight: "600",
                          fontSize: 11,
                        }}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {Array.from(
                      new Set(availableExercises.map((e: any) => e.category).filter(Boolean))
                    ).map((bodyPart: any) => (
                      <TouchableOpacity
                        key={bodyPart}
                        onPress={() => setModalFilterBodyPart(bodyPart)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          backgroundColor:
                            modalFilterBodyPart === bodyPart
                              ? theme.accent
                              : theme.backgroundSecondary,
                          borderColor:
                            modalFilterBodyPart === bodyPart ? theme.accent : theme.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              modalFilterBodyPart === bodyPart
                                ? "white"
                                : theme.textSecondary,
                            fontWeight: "600",
                            fontSize: 11,
                            textTransform: "capitalize",
                          }}
                        >
                          {bodyPart === "full body"
                            ? "Full Body"
                            : String(bodyPart).charAt(0).toUpperCase() + String(bodyPart).slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {loadingExercises ? (
                <ActivityIndicator color={theme.accent} style={{ marginVertical: 24 }} />
              ) : (
                <View style={{ gap: 8, marginBottom: 24 }}>
                  {availableExercises
                    .filter((exercise: any) => {
                      if (modalFilterBodyPart && exercise.category !== modalFilterBodyPart) {
                        return false;
                      }
                      return true;
                    })
                    .map((exercise: any) => {
                      const isSelected = selectedExercises.find(
                        (e: any) => e.id === exercise.id
                      );
                      return (
                        <TouchableOpacity
                          key={exercise.id}
                          onPress={() => toggleExercise(exercise)}
                          style={{
                            backgroundColor: isSelected
                              ? theme.backgroundTertiary
                              : theme.backgroundSecondary,
                            borderColor: isSelected ? theme.accent : theme.border,
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                color: theme.text,
                                fontWeight: "500",
                                fontSize: 14,
                                marginBottom: 8,
                              }}
                            >
                              {exercise.nome}
                            </Text>
                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                              {exercise.category && (
                                <View
                                  style={{
                                    backgroundColor: theme.backgroundTertiary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 11,
                                      fontWeight: "500",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {exercise.category}
                                  </Text>
                                </View>
                              )}
                              {exercise.subType && (
                                <View
                                  style={{
                                    backgroundColor: theme.backgroundTertiary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 11,
                                      fontWeight: "500",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {exercise.subType}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Ionicons
                            name={
                              isSelected ? "checkmark-circle" : "add-circle-outline"
                            }
                            size={24}
                            color={isSelected ? theme.accent : theme.textTertiary}
                          />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}
            </ScrollView>

            {/* Botão Criar */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderTopColor: theme.border,
                borderTopWidth: 1,
              }}
            >
              <TouchableOpacity
                onPress={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
                disabled={savingWorkout}
                style={{
                  backgroundColor: theme.accent,
                  paddingVertical: 16,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {savingWorkout ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                    {editingWorkout ? "Guardar Alterações" : "Criar Treino"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Partilhar Template de Treino */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "70%" }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />

            <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 24, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>Partilhar Treino</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                  {shareWorkoutData?.nome}
                </Text>
                {/* Show all exercise names */}
                {shareWorkoutData?.exercicios && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>Exercícios:</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {shareWorkoutData.exercicios.map((ex: any, idx: number) => (
                        <View key={ex.id || idx} style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6 }}>
                          <Text style={{ color: theme.text, fontSize: 12 }}>{ex.nome}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => setShowShareModal(false)}
                accessibilityLabel="Fechar"
                accessibilityRole="button"
                style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: 12, padding: 8, opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>

            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginHorizontal: 24, marginBottom: 10 }}>
              Escolhe uma comunidade
            </Text>

            <FlatList
              data={userCommunities}
              keyExtractor={(item) => String(item.id)}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => sendShareToCommunity(item)}
                  disabled={sharingToComm}
                  accessibilityLabel={`Partilhar com ${item.nome}`}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: 16,
                    padding: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.accent + "18", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                    <Ionicons name="people" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>{item.nome}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{item.membros} membros</Text>
                  </View>
                  {sharingToComm ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Ionicons name="send" size={18} color={theme.accent} />
                  )}
                </Pressable>
              )}
            />
            {/* Copy workout to user's list if not IA */}
            {shareWorkoutData && !shareWorkoutData.is_ia && (
              <View style={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}>
                <TouchableOpacity
                  onPress={copyWorkoutToUserList}
                  style={{ backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 }}
                  accessibilityLabel="Copiar treino para minha lista"
                  accessibilityRole="button"
                  disabled={copyingWorkout}
                >
                  {copyingWorkout ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                      Copiar treino para minha lista
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
