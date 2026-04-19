/* eslint-disable no-undef */

use('escalas_app');

const COLLECTIONS = [
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
];

COLLECTIONS.forEach((name) => {
  if (db.getCollectionInfos({ name }).length) {
    db[name].drop();
  }
});

db.createCollection('groups', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['slug', 'name', 'status', 'createdAt', 'updatedAt'],
      properties: {
        slug: { bsonType: 'string' },
        name: { bsonType: 'string', minLength: 3, maxLength: 80 },
        status: { enum: ['active', 'inactive'] },
        photoAssetId: { bsonType: ['objectId', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('group_functions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['key', 'label', 'hint', 'createdAt'],
      properties: {
        key: { bsonType: 'string' },
        label: { bsonType: 'string' },
        hint: { bsonType: 'string' },
        isDefault: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('group_settings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['groupId', 'themeName', 'availableFunctionIds', 'createdAt', 'updatedAt'],
      properties: {
        groupId: { bsonType: 'objectId' },
        themeName: { enum: ['aurora', 'midnight', 'sunrise'] },
        availableFunctionIds: {
          bsonType: 'array',
          minItems: 1,
          items: { bsonType: 'objectId' }
        },
        savedByUserId: { bsonType: ['objectId', 'null'] },
        lastSavedAt: { bsonType: ['date', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['profileType', 'displayName', 'identifier', 'passwordHash', 'status', 'createdAt', 'updatedAt'],
      properties: {
        groupId: { bsonType: ['objectId', 'null'] },
        profileType: { enum: ['admin', 'group_owner', 'component'] },
        displayName: { bsonType: 'string' },
        identifier: {
          bsonType: 'object',
          required: ['login'],
          properties: {
            login: { bsonType: 'string' },
            email: { bsonType: ['string', 'null'] },
            username: { bsonType: ['string', 'null'] },
            phone: { bsonType: ['string', 'null'] }
          }
        },
        passwordHash: { bsonType: 'string' },
        status: { enum: ['active', 'inactive'] },
        photoAssetId: { bsonType: ['objectId', 'null'] },
        lastLoginAt: { bsonType: ['date', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('components', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['groupId', 'fullName', 'birthDate', 'isActive', 'createdAt', 'updatedAt'],
      properties: {
        groupId: { bsonType: 'objectId' },
        authUserId: { bsonType: ['objectId', 'null'] },
        photoAssetId: { bsonType: ['objectId', 'null'] },
        fullName: { bsonType: 'string' },
        birthDate: { bsonType: 'date' },
        isActive: { bsonType: 'bool' },
        createdByUserId: { bsonType: ['objectId', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('scales', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['groupId', 'scaleDate', 'shift', 'canEdit', 'status', 'createdAt', 'updatedAt'],
      properties: {
        groupId: { bsonType: 'objectId' },
        scaleDate: { bsonType: 'date' },
        shift: { enum: ['Manha', 'Tarde', 'Noite'] },
        canEdit: { bsonType: 'bool' },
        status: { enum: ['draft', 'published', 'cancelled'] },
        createdByUserId: { bsonType: ['objectId', 'null'] },
        imageAttachmentId: { bsonType: ['objectId', 'null'] },
        notificationCount: { bsonType: ['int', 'long', 'double', 'decimal', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('scale_assignments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['scaleId', 'componentId', 'functionId', 'isLeader', 'displayOrder', 'createdAt'],
      properties: {
        scaleId: { bsonType: 'objectId' },
        componentId: { bsonType: 'objectId' },
        functionId: { bsonType: 'objectId' },
        isLeader: { bsonType: 'bool' },
        displayOrder: { bsonType: ['int', 'long'] },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('playlists', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['scaleId', 'source', 'createdAt', 'updatedAt'],
      properties: {
        scaleId: { bsonType: 'objectId' },
        source: { enum: ['manual', 'youtube_search', 'youtube_preview', 'mixed'] },
        createdByUserId: { bsonType: ['objectId', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('playlist_items', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['playlistId', 'order', 'videoId', 'title', 'videoUrl', 'source', 'createdAt'],
      properties: {
        playlistId: { bsonType: 'objectId' },
        order: { bsonType: ['int', 'long'] },
        videoId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        channelTitle: { bsonType: ['string', 'null'] },
        thumbnailUrl: { bsonType: ['string', 'null'] },
        videoUrl: { bsonType: 'string' },
        source: { enum: ['manual', 'search', 'preview'] },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('scale_messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['scaleId', 'type', 'payload', 'meta', 'createdAt'],
      properties: {
        scaleId: { bsonType: 'objectId' },
        authorUserId: { bsonType: ['objectId', 'null'] },
        authorComponentId: { bsonType: ['objectId', 'null'] },
        type: { enum: ['text'] },
        payload: {
          bsonType: 'object',
          required: ['text'],
          properties: {
            text: { bsonType: 'string' }
          }
        },
        meta: {
          bsonType: 'object',
          required: ['authorName', 'status', 'createdAt'],
          properties: {
            authorName: { bsonType: 'string' },
            status: { enum: ['sent', 'failed'] },
            createdAt: { bsonType: 'date' }
          }
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('media_assets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['groupId', 'ownerType', 'ownerId', 'kind', 'source', 'url', 'createdAt'],
      properties: {
        groupId: { bsonType: 'objectId' },
        ownerType: { enum: ['group', 'component', 'scale', 'user'] },
        ownerId: { bsonType: 'objectId' },
        kind: { enum: ['image'] },
        source: { enum: ['upload', 'preset', 'external'] },
        url: { bsonType: 'string' },
        alt: { bsonType: ['string', 'null'] },
        label: { bsonType: ['string', 'null'] },
        mimeType: { bsonType: ['string', 'null'] },
        sourceScaleId: { bsonType: ['objectId', 'null'] },
        sourceScaleLabel: { bsonType: ['string', 'null'] },
        isLocalUpload: { bsonType: ['bool', 'null'] },
        createdByUserId: { bsonType: ['objectId', 'null'] },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

// Indexes

db.groups.createIndex({ slug: 1 }, { unique: true, name: 'uq_groups_slug' });
db.groups.createIndex({ status: 1, name: 1 }, { name: 'ix_groups_status_name' });

db.group_functions.createIndex({ key: 1 }, { unique: true, name: 'uq_group_functions_key' });

db.group_settings.createIndex({ groupId: 1 }, { unique: true, name: 'uq_group_settings_group' });

db.users.createIndex({ 'identifier.login': 1 }, { unique: true, name: 'uq_users_identifier_login' });
db.users.createIndex({ groupId: 1, profileType: 1, status: 1 }, { name: 'ix_users_group_profile_status' });

db.components.createIndex({ groupId: 1, fullName: 1 }, { name: 'ix_components_group_name' });
db.components.createIndex({ authUserId: 1 }, { unique: true, sparse: true, name: 'uq_components_auth_user' });

db.scales.createIndex({ groupId: 1, scaleDate: -1, shift: 1 }, { name: 'ix_scales_group_date_shift' });
db.scales.createIndex({ groupId: 1, scaleDate: 1, shift: 1 }, { unique: true, name: 'uq_scales_group_date_shift' });

db.scale_assignments.createIndex({ scaleId: 1, displayOrder: 1 }, { name: 'ix_scale_assignments_scale_order' });
db.scale_assignments.createIndex({ scaleId: 1, componentId: 1 }, { unique: true, name: 'uq_scale_assignments_scale_component' });
db.scale_assignments.createIndex({ componentId: 1, createdAt: -1 }, { name: 'ix_scale_assignments_component_created' });

db.playlists.createIndex({ scaleId: 1 }, { unique: true, name: 'uq_playlists_scale' });

db.playlist_items.createIndex({ playlistId: 1, order: 1 }, { unique: true, name: 'uq_playlist_items_playlist_order' });
db.playlist_items.createIndex({ playlistId: 1, videoId: 1 }, { unique: true, name: 'uq_playlist_items_playlist_video' });

db.scale_messages.createIndex({ scaleId: 1, createdAt: 1 }, { name: 'ix_scale_messages_scale_created' });
db.scale_messages.createIndex({ authorUserId: 1, createdAt: -1 }, { name: 'ix_scale_messages_author_created' });

db.media_assets.createIndex({ groupId: 1, ownerType: 1, ownerId: 1, createdAt: -1 }, { name: 'ix_media_assets_owner' });
db.media_assets.createIndex({ sourceScaleId: 1, createdAt: -1 }, { sparse: true, name: 'ix_media_assets_source_scale' });

print('Banco escalas_app criado com sucesso.');
print('Collections: ' + COLLECTIONS.join(', '));
