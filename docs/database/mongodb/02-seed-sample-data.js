/* eslint-disable no-undef */

use('escalas_app');

const ids = {
  groups: {
    avivah: ObjectId('681a00000000000000000001'),
    jovens: ObjectId('681a00000000000000000002'),
    tecnica: ObjectId('681a00000000000000000003'),
    celulas: ObjectId('681a00000000000000000004')
  },
  groupSettings: {
    avivah: ObjectId('681a00000000000000000101')
  },
  functions: {
    vocal: ObjectId('681a00000000000000001001'),
    backVocal: ObjectId('681a00000000000000001002'),
    guitarra: ObjectId('681a00000000000000001003'),
    violao: ObjectId('681a00000000000000001004'),
    baixo: ObjectId('681a00000000000000001005'),
    teclado: ObjectId('681a00000000000000001006'),
    bateria: ObjectId('681a00000000000000001007'),
    percussao: ObjectId('681a00000000000000001008'),
    midia: ObjectId('681a00000000000000001009'),
    sonoplastia: ObjectId('681a0000000000000000100a')
  },
  users: {
    adminMaster: ObjectId('681a00000000000000002001'),
    groupOwnerAvivah: ObjectId('681a00000000000000002002'),
    lucas: ObjectId('681a00000000000000002003'),
    ana: ObjectId('681a00000000000000002004'),
    bruno: ObjectId('681a00000000000000002005'),
    marcela: ObjectId('681a00000000000000002006'),
    gustavo: ObjectId('681a00000000000000002007'),
    fernanda: ObjectId('681a00000000000000002008'),
    thiago: ObjectId('681a00000000000000002009'),
    juliana: ObjectId('681a0000000000000000200a')
  },
  components: {
    lucas: ObjectId('681a00000000000000003001'),
    ana: ObjectId('681a00000000000000003002'),
    bruno: ObjectId('681a00000000000000003003'),
    marcela: ObjectId('681a00000000000000003004'),
    gustavo: ObjectId('681a00000000000000003005'),
    fernanda: ObjectId('681a00000000000000003006'),
    thiago: ObjectId('681a00000000000000003007'),
    juliana: ObjectId('681a00000000000000003008')
  },
  scales: {
    manha1204: ObjectId('681a00000000000000004001'),
    noite1204: ObjectId('681a00000000000000004002')
  },
  scaleAssignments: {
    a1: ObjectId('681a00000000000000005001'),
    a2: ObjectId('681a00000000000000005002'),
    a3: ObjectId('681a00000000000000005003'),
    a4: ObjectId('681a00000000000000005004'),
    a5: ObjectId('681a00000000000000005005'),
    a6: ObjectId('681a00000000000000005006'),
    a7: ObjectId('681a00000000000000005007'),
    a8: ObjectId('681a00000000000000005008')
  },
  playlists: {
    manha1204: ObjectId('681a00000000000000006001'),
    noite1204: ObjectId('681a00000000000000006002')
  },
  playlistItems: {
    p1: ObjectId('681a00000000000000007001'),
    p2: ObjectId('681a00000000000000007002'),
    p3: ObjectId('681a00000000000000007003'),
    p4: ObjectId('681a00000000000000007004'),
    p5: ObjectId('681a00000000000000007005')
  },
  messages: {
    m1: ObjectId('681a00000000000000008001'),
    m2: ObjectId('681a00000000000000008002'),
    m3: ObjectId('681a00000000000000008003')
  },
  mediaAssets: {
    grupoAvivah: ObjectId('681a00000000000000009001'),
    escalaManha: ObjectId('681a00000000000000009002'),
    lucasPhoto: ObjectId('681a00000000000000009003'),
    anaPhoto: ObjectId('681a00000000000000009004'),
    brunoPhoto: ObjectId('681a00000000000000009005'),
    marcelaPhoto: ObjectId('681a00000000000000009006'),
    gustavoPhoto: ObjectId('681a00000000000000009007'),
    fernandaPhoto: ObjectId('681a00000000000000009008'),
    thiagoPhoto: ObjectId('681a00000000000000009009'),
    julianaPhoto: ObjectId('681a0000000000000000900a')
  }
};

const now = new Date('2026-04-12T12:00:00.000Z');

// Clean collections for idempotent seed
[
  'groups',
  'group_functions',
  'group_settings',
  'users',
  'components',
  'scales',
  'scale_assignments',
  'playlists',
  'playlist_items',
  'scale_messages',
  'media_assets'
].forEach((name) => db[name].deleteMany({}));

// group_functions

db.group_functions.insertMany([
  { _id: ids.functions.vocal, key: 'vocal', label: 'Vocal', hint: 'Conducao principal de voz', isDefault: true, createdAt: now },
  { _id: ids.functions.backVocal, key: 'back-vocal', label: 'Back Vocal', hint: 'Apoio harmonico de voz', isDefault: true, createdAt: now },
  { _id: ids.functions.guitarra, key: 'guitarra', label: 'Guitarra', hint: 'Base e riffs de guitarra', isDefault: true, createdAt: now },
  { _id: ids.functions.violao, key: 'violao', label: 'Violao', hint: 'Conducao harmonica acustica', isDefault: true, createdAt: now },
  { _id: ids.functions.baixo, key: 'baixo', label: 'Baixo', hint: 'Fundacao ritmica e harmonica', isDefault: true, createdAt: now },
  { _id: ids.functions.teclado, key: 'teclado', label: 'Teclado', hint: 'Camadas, piano e pads', isDefault: true, createdAt: now },
  { _id: ids.functions.bateria, key: 'bateria', label: 'Bateria', hint: 'Conducao ritmica principal', isDefault: true, createdAt: now },
  { _id: ids.functions.percussao, key: 'percussao', label: 'Percussao', hint: 'Texturas ritmicas adicionais', isDefault: true, createdAt: now },
  { _id: ids.functions.midia, key: 'midia', label: 'Midia', hint: 'Operacao de exibicao e apoio', isDefault: true, createdAt: now },
  { _id: ids.functions.sonoplastia, key: 'sonoplastia', label: 'Sonoplastia', hint: 'Mixagem e controle de audio', isDefault: true, createdAt: now }
]);

// groups

db.groups.insertMany([
  {
    _id: ids.groups.avivah,
    slug: '607c71ca0171590015ff9c91',
    name: 'Ministerio Avivah',
    status: 'active',
    photoAssetId: ids.mediaAssets.grupoAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.groups.jovens,
    slug: 'grupo-jovens',
    name: 'Jovens em Foco',
    status: 'inactive',
    photoAssetId: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.groups.tecnica,
    slug: 'grupo-tecnica',
    name: 'Equipe Tecnica',
    status: 'active',
    photoAssetId: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.groups.celulas,
    slug: 'grupo-celulas',
    name: 'Celulas e Conexao',
    status: 'active',
    photoAssetId: null,
    createdAt: now,
    updatedAt: now
  }
]);

// users

db.users.insertMany([
  {
    _id: ids.users.adminMaster,
    groupId: null,
    profileType: 'admin',
    displayName: 'Administrador Geral',
    identifier: {
      login: 'admin@escalas.app',
      email: 'admin@escalas.app',
      username: 'admin.master',
      phone: null
    },
    passwordHash: 'bcrypt$2b$12$admin_mock_hash',
    status: 'active',
    photoAssetId: null,
    lastLoginAt: new Date('2026-04-12T11:00:00.000Z'),
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.groupOwnerAvivah,
    groupId: ids.groups.avivah,
    profileType: 'group_owner',
    displayName: 'Ministerio de Louvor Avivah',
    identifier: {
      login: 'avivah@ministerio.com',
      email: 'avivah@ministerio.com',
      username: 'ministerio.avivah',
      phone: '+5511999999999'
    },
    passwordHash: 'bcrypt$2b$12$group_mock_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.grupoAvivah,
    lastLoginAt: new Date('2026-04-12T10:30:00.000Z'),
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.lucas,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Lucas Andrade',
    identifier: { login: 'lucas.andrade', email: null, username: 'lucas.andrade', phone: null },
    passwordHash: 'bcrypt$2b$12$lucas_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.lucasPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.ana,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Ana Paula',
    identifier: { login: 'ana.paula', email: null, username: 'ana.paula', phone: null },
    passwordHash: 'bcrypt$2b$12$ana_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.anaPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.bruno,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Bruno Matos',
    identifier: { login: 'bruno.matos', email: null, username: 'bruno.matos', phone: null },
    passwordHash: 'bcrypt$2b$12$bruno_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.brunoPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.marcela,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Marcela Souza',
    identifier: { login: 'marcela.souza', email: null, username: 'marcela.souza', phone: null },
    passwordHash: 'bcrypt$2b$12$marcela_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.marcelaPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.gustavo,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Gustavo Lima',
    identifier: { login: 'gustavo.lima', email: null, username: 'gustavo.lima', phone: null },
    passwordHash: 'bcrypt$2b$12$gustavo_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.gustavoPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.fernanda,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Fernanda Alves',
    identifier: { login: 'fernanda.alves', email: null, username: 'fernanda.alves', phone: null },
    passwordHash: 'bcrypt$2b$12$fernanda_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.fernandaPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.thiago,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Thiago Nunes',
    identifier: { login: 'thiago.nunes', email: null, username: 'thiago.nunes', phone: null },
    passwordHash: 'bcrypt$2b$12$thiago_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.thiagoPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.juliana,
    groupId: ids.groups.avivah,
    profileType: 'component',
    displayName: 'Juliana Costa',
    identifier: { login: 'juliana.costa', email: null, username: 'juliana.costa', phone: null },
    passwordHash: 'bcrypt$2b$12$juliana_hash',
    status: 'active',
    photoAssetId: ids.mediaAssets.julianaPhoto,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  }
]);

// components

db.components.insertMany([
  {
    _id: ids.components.lucas,
    groupId: ids.groups.avivah,
    authUserId: ids.users.lucas,
    photoAssetId: ids.mediaAssets.lucasPhoto,
    fullName: 'Lucas Andrade',
    birthDate: new Date('1993-03-11T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.ana,
    groupId: ids.groups.avivah,
    authUserId: ids.users.ana,
    photoAssetId: ids.mediaAssets.anaPhoto,
    fullName: 'Ana Paula',
    birthDate: new Date('1997-09-19T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.bruno,
    groupId: ids.groups.avivah,
    authUserId: ids.users.bruno,
    photoAssetId: ids.mediaAssets.brunoPhoto,
    fullName: 'Bruno Matos',
    birthDate: new Date('1995-01-27T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.marcela,
    groupId: ids.groups.avivah,
    authUserId: ids.users.marcela,
    photoAssetId: ids.mediaAssets.marcelaPhoto,
    fullName: 'Marcela Souza',
    birthDate: new Date('1994-12-05T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.gustavo,
    groupId: ids.groups.avivah,
    authUserId: ids.users.gustavo,
    photoAssetId: ids.mediaAssets.gustavoPhoto,
    fullName: 'Gustavo Lima',
    birthDate: new Date('1991-07-21T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.fernanda,
    groupId: ids.groups.avivah,
    authUserId: ids.users.fernanda,
    photoAssetId: ids.mediaAssets.fernandaPhoto,
    fullName: 'Fernanda Alves',
    birthDate: new Date('1996-02-17T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.thiago,
    groupId: ids.groups.avivah,
    authUserId: ids.users.thiago,
    photoAssetId: ids.mediaAssets.thiagoPhoto,
    fullName: 'Thiago Nunes',
    birthDate: new Date('1992-11-02T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.components.juliana,
    groupId: ids.groups.avivah,
    authUserId: ids.users.juliana,
    photoAssetId: ids.mediaAssets.julianaPhoto,
    fullName: 'Juliana Costa',
    birthDate: new Date('1998-05-23T00:00:00.000Z'),
    isActive: true,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  }
]);

// group_settings

db.group_settings.insertOne({
  _id: ids.groupSettings.avivah,
  groupId: ids.groups.avivah,
  themeName: 'aurora',
  availableFunctionIds: [ids.functions.vocal, ids.functions.guitarra, ids.functions.teclado, ids.functions.bateria],
  savedByUserId: ids.users.groupOwnerAvivah,
  lastSavedAt: now,
  createdAt: now,
  updatedAt: now
});

// scales

db.scales.insertMany([
  {
    _id: ids.scales.manha1204,
    groupId: ids.groups.avivah,
    scaleDate: new Date('2026-04-12T00:00:00.000Z'),
    shift: 'Manha',
    canEdit: true,
    status: 'published',
    createdByUserId: ids.users.groupOwnerAvivah,
    imageAttachmentId: ids.mediaAssets.escalaManha,
    notificationCount: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.scales.noite1204,
    groupId: ids.groups.avivah,
    scaleDate: new Date('2026-04-12T00:00:00.000Z'),
    shift: 'Noite',
    canEdit: false,
    status: 'published',
    createdByUserId: ids.users.groupOwnerAvivah,
    imageAttachmentId: null,
    notificationCount: 0,
    createdAt: now,
    updatedAt: now
  }
]);

// scale_assignments

db.scale_assignments.insertMany([
  { _id: ids.scaleAssignments.a1, scaleId: ids.scales.manha1204, componentId: ids.components.lucas, functionId: ids.functions.vocal, isLeader: true, displayOrder: 1, createdAt: now },
  { _id: ids.scaleAssignments.a2, scaleId: ids.scales.manha1204, componentId: ids.components.ana, functionId: ids.functions.vocal, isLeader: false, displayOrder: 2, createdAt: now },
  { _id: ids.scaleAssignments.a3, scaleId: ids.scales.manha1204, componentId: ids.components.bruno, functionId: ids.functions.vocal, isLeader: false, displayOrder: 3, createdAt: now },
  { _id: ids.scaleAssignments.a4, scaleId: ids.scales.manha1204, componentId: ids.components.marcela, functionId: ids.functions.teclado, isLeader: false, displayOrder: 4, createdAt: now },
  { _id: ids.scaleAssignments.a5, scaleId: ids.scales.manha1204, componentId: ids.components.gustavo, functionId: ids.functions.bateria, isLeader: false, displayOrder: 5, createdAt: now },
  { _id: ids.scaleAssignments.a6, scaleId: ids.scales.noite1204, componentId: ids.components.fernanda, functionId: ids.functions.vocal, isLeader: true, displayOrder: 1, createdAt: now },
  { _id: ids.scaleAssignments.a7, scaleId: ids.scales.noite1204, componentId: ids.components.thiago, functionId: ids.functions.guitarra, isLeader: false, displayOrder: 2, createdAt: now },
  { _id: ids.scaleAssignments.a8, scaleId: ids.scales.noite1204, componentId: ids.components.juliana, functionId: ids.functions.vocal, isLeader: false, displayOrder: 3, createdAt: now }
]);

// playlists

db.playlists.insertMany([
  {
    _id: ids.playlists.manha1204,
    scaleId: ids.scales.manha1204,
    source: 'mixed',
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.playlists.noite1204,
    scaleId: ids.scales.noite1204,
    source: 'mixed',
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now,
    updatedAt: now
  }
]);

// playlist_items

db.playlist_items.insertMany([
  {
    _id: ids.playlistItems.p1,
    playlistId: ids.playlists.manha1204,
    order: 1,
    videoId: 'KS44J5wDxUc',
    title: "Aquieta Minh'alma",
    channelTitle: 'Ministerio Avivah',
    thumbnailUrl: 'https://i.ytimg.com/vi/KS44J5wDxUc/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=KS44J5wDxUc',
    source: 'manual',
    createdAt: now
  },
  {
    _id: ids.playlistItems.p2,
    playlistId: ids.playlists.manha1204,
    order: 2,
    videoId: 'Ks2lsoQxuXY',
    title: 'Grandes Coisas',
    channelTitle: 'Ministerio Avivah',
    thumbnailUrl: 'https://i.ytimg.com/vi/Ks2lsoQxuXY/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Ks2lsoQxuXY',
    source: 'search',
    createdAt: now
  },
  {
    _id: ids.playlistItems.p3,
    playlistId: ids.playlists.manha1204,
    order: 3,
    videoId: '8lR2NQ9nY8Q',
    title: 'Que Amor E Esse',
    channelTitle: 'Ministerio Avivah',
    thumbnailUrl: 'https://i.ytimg.com/vi/8lR2NQ9nY8Q/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=8lR2NQ9nY8Q',
    source: 'preview',
    createdAt: now
  },
  {
    _id: ids.playlistItems.p4,
    playlistId: ids.playlists.noite1204,
    order: 1,
    videoId: 'Ks2lsoQxuXY',
    title: 'Lugar Secreto',
    channelTitle: 'Ministerio Avivah',
    thumbnailUrl: 'https://i.ytimg.com/vi/Ks2lsoQxuXY/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Ks2lsoQxuXY',
    source: 'manual',
    createdAt: now
  },
  {
    _id: ids.playlistItems.p5,
    playlistId: ids.playlists.noite1204,
    order: 2,
    videoId: 'KS44J5wDxUc',
    title: 'Ele Vem',
    channelTitle: 'Ministerio Avivah',
    thumbnailUrl: 'https://i.ytimg.com/vi/KS44J5wDxUc/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=KS44J5wDxUc',
    source: 'manual',
    createdAt: now
  }
]);

// scale_messages

db.scale_messages.insertMany([
  {
    _id: ids.messages.m1,
    scaleId: ids.scales.manha1204,
    authorUserId: ids.users.lucas,
    authorComponentId: ids.components.lucas,
    type: 'text',
    payload: {
      text: 'Pessoal, confirmar passagem de som ate 08:20.'
    },
    meta: {
      authorName: 'Lucas Andrade',
      status: 'sent',
      createdAt: new Date('2026-04-12T10:05:00.000Z')
    },
    createdAt: new Date('2026-04-12T10:05:00.000Z')
  },
  {
    _id: ids.messages.m2,
    scaleId: ids.scales.manha1204,
    authorUserId: ids.users.marcela,
    authorComponentId: ids.components.marcela,
    type: 'text',
    payload: {
      text: 'Ok! Ja estamos organizando os retornos.'
    },
    meta: {
      authorName: 'Marcela Souza',
      status: 'sent',
      createdAt: new Date('2026-04-12T10:07:00.000Z')
    },
    createdAt: new Date('2026-04-12T10:07:00.000Z')
  },
  {
    _id: ids.messages.m3,
    scaleId: ids.scales.noite1204,
    authorUserId: ids.users.fernanda,
    authorComponentId: ids.components.fernanda,
    type: 'text',
    payload: {
      text: 'Chegada prevista do time as 18:40.'
    },
    meta: {
      authorName: 'Fernanda Alves',
      status: 'sent',
      createdAt: new Date('2026-04-12T21:30:00.000Z')
    },
    createdAt: new Date('2026-04-12T21:30:00.000Z')
  }
]);

// media_assets

db.media_assets.insertMany([
  {
    _id: ids.mediaAssets.grupoAvivah,
    groupId: ids.groups.avivah,
    ownerType: 'group',
    ownerId: ids.groups.avivah,
    kind: 'image',
    source: 'external',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=320&q=80',
    alt: 'Foto oficial do grupo Ministerio Avivah',
    label: 'Foto principal do grupo',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.escalaManha,
    groupId: ids.groups.avivah,
    ownerType: 'scale',
    ownerId: ids.scales.manha1204,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/640?img=52',
    alt: 'Imagem vinculada a escala da manha de 12/04/2026',
    label: 'Imagem principal da escala da manha',
    mimeType: 'image/jpeg',
    sourceScaleId: ids.scales.manha1204,
    sourceScaleLabel: '12/04/2026 - Manha',
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.lucasPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.lucas,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=11',
    alt: 'Foto de Lucas Andrade',
    label: 'Lucas Andrade',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.anaPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.ana,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=5',
    alt: 'Foto de Ana Paula',
    label: 'Ana Paula',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.brunoPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.bruno,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=16',
    alt: 'Foto de Bruno Matos',
    label: 'Bruno Matos',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.marcelaPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.marcela,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=32',
    alt: 'Foto de Marcela Souza',
    label: 'Marcela Souza',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.gustavoPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.gustavo,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=41',
    alt: 'Foto de Gustavo Lima',
    label: 'Gustavo Lima',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.fernandaPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.fernanda,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=45',
    alt: 'Foto de Fernanda Alves',
    label: 'Fernanda Alves',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.thiagoPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.thiago,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=14',
    alt: 'Foto de Thiago Nunes',
    label: 'Thiago Nunes',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  },
  {
    _id: ids.mediaAssets.julianaPhoto,
    groupId: ids.groups.avivah,
    ownerType: 'component',
    ownerId: ids.components.juliana,
    kind: 'image',
    source: 'external',
    url: 'https://i.pravatar.cc/120?img=22',
    alt: 'Foto de Juliana Costa',
    label: 'Juliana Costa',
    mimeType: 'image/jpeg',
    sourceScaleId: null,
    sourceScaleLabel: null,
    isLocalUpload: false,
    createdByUserId: ids.users.groupOwnerAvivah,
    createdAt: now
  }
]);

print('Seed concluido com sucesso.');
print('Total groups: ' + db.groups.countDocuments());
print('Total functions: ' + db.group_functions.countDocuments());
print('Total users: ' + db.users.countDocuments());
print('Total components: ' + db.components.countDocuments());
print('Total scales: ' + db.scales.countDocuments());
print('Total assignments: ' + db.scale_assignments.countDocuments());
print('Total playlists: ' + db.playlists.countDocuments());
print('Total playlist_items: ' + db.playlist_items.countDocuments());
print('Total messages: ' + db.scale_messages.countDocuments());
print('Total media_assets: ' + db.media_assets.countDocuments());
