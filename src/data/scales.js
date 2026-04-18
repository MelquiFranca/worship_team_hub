export const scales = [
  {
    id: 'escala-2026-04-12-manha',
    date: '12/04/2026',
    shift: 'Manha',
    canEdit: true,
    members: [
      {
        id: 'm1',
        name: 'Lucas Andrade',
        role: 'Lider',
        photo: 'https://i.pravatar.cc/120?img=11',
        isLeader: true
      },
      {
        id: 'm2',
        name: 'Ana Paula',
        role: 'Vocal',
        photo: 'https://i.pravatar.cc/120?img=5',
        isLeader: false
      },
      {
        id: 'm3',
        name: 'Bruno Matos',
        role: 'Vocal',
        photo: 'https://i.pravatar.cc/120?img=16',
        isLeader: false
      },
      {
        id: 'm4',
        name: 'Marcela Souza',
        role: 'Teclado',
        photo: 'https://i.pravatar.cc/120?img=32',
        isLeader: false
      },
      {
        id: 'm5',
        name: 'Gustavo Lima',
        role: 'Bateria',
        photo: 'https://i.pravatar.cc/120?img=41',
        isLeader: false
      }
    ],
    playlist: [
      {
        id: 'p1',
        title: 'Aquieta Minh\'alma',
        videoUrl: 'https://youtu.be/KS44J5wDxUc?si=T7Vi5aum2BfzzBGU'
      },
      {
        id: 'p2',
        title: 'Grandes Coisas',
        videoUrl: 'https://youtu.be/Ks2lsoQxuXY?si=VzqzFzD_VokYfVp3'
      },
      {
        id: 'p3',
        title: 'Que Amor E Esse',
        videoUrl: 'https://www.youtube.com/watch?v=8lR2NQ9nY8Q'
      }
    ],
    playlistEditorComponentIds: ['m1', 'm4'],
    imageEditorComponentIds: ['m1'],
    imageAttachment: {
      id: 'img-escala-2026-04-12-manha',
      src: 'https://i.pravatar.cc/640?img=52',
      alt: 'Imagem vinculada a escala da manha de 12/04/2026',
      label: 'Imagem principal da escala da manha',
      sourceScaleId: 'escala-2026-04-12-manha',
      sourceScaleLabel: '12/04/2026 - Manha'
    },
    messages: [
      {
        id: 'msg-1',
        type: 'text',
        payload: {
          text: 'Pessoal, confirmar passagem de som ate 08:20.'
        },
        meta: {
          authorId: 'm1',
          authorName: 'Lucas Andrade',
          createdAt: '2026-04-12T10:05:00.000Z',
          status: 'sent'
        }
      },
      {
        id: 'msg-2',
        type: 'text',
        payload: {
          text: 'Ok! Ja estamos organizando os retornos.'
        },
        meta: {
          authorId: 'm4',
          authorName: 'Marcela Souza',
          createdAt: '2026-04-12T10:07:00.000Z',
          status: 'sent'
        }
      }
    ]
  },
  {
    id: 'escala-2026-04-12-noite',
    date: '12/04/2026',
    shift: 'Noite',
    canEdit: false,
    members: [
      {
        id: 'm6',
        name: 'Fernanda Alves',
        role: 'Lider',
        photo: 'https://i.pravatar.cc/120?img=45',
        isLeader: true
      },
      {
        id: 'm7',
        name: 'Thiago Nunes',
        role: 'Guitarra',
        photo: 'https://i.pravatar.cc/120?img=14',
        isLeader: false
      },
      {
        id: 'm8',
        name: 'Juliana Costa',
        role: 'Vocal',
        photo: 'https://i.pravatar.cc/120?img=22',
        isLeader: false
      }
    ],
    playlist: [
      {
        id: 'p4',
        title: 'Lugar Secreto',
        videoUrl: 'https://youtu.be/Ks2lsoQxuXY?si=VzqzFzD_VokYfVp3'
      },
      {
        id: 'p5',
        title: 'Ele Vem',
        videoUrl: 'https://youtu.be/KS44J5wDxUc?si=T7Vi5aum2BfzzBGU'
      }
    ],
    playlistEditorComponentIds: ['m6'],
    imageEditorComponentIds: [],
    messages: [
      {
        id: 'msg-3',
        type: 'text',
        payload: {
          text: 'Chegada prevista do time as 18:40.'
        },
        meta: {
          authorId: 'm6',
          authorName: 'Fernanda Alves',
          createdAt: '2026-04-12T21:30:00.000Z',
          status: 'sent'
        }
      }
    ]
  }
];
