import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMessaging() {
  console.log('🌱 Seeding messaging data...');

  try {
    // Find some existing users to create conversations with
    const users = await prisma.user.findMany({
      take: 4,
      where: {
        status: 'ACTIVE',
      },
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create conversations');
      return;
    }

    // Create a direct conversation between first two users
    const directConversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        title: `${users[0].firstName} & ${users[1].firstName}`,
        createdBy: users[0].id,
        members: {
          create: [
            {
              userId: users[0].id,
              isAdmin: true,
            },
            {
              userId: users[1].id,
              isAdmin: false,
            },
          ],
        },
      },
    });

    // Create some messages in the direct conversation
    const messages = await Promise.all([
      prisma.message.create({
        data: {
          conversationId: directConversation.id,
          senderId: users[0].id,
          content: 'Hello! How are you doing today?',
          type: 'TEXT',
          status: 'READ',
        },
      }),
      prisma.message.create({
        data: {
          conversationId: directConversation.id,
          senderId: users[1].id,
          content:
            "Hi there! I'm doing great, thanks for asking. How about you?",
          type: 'TEXT',
          status: 'READ',
        },
      }),
      prisma.message.create({
        data: {
          conversationId: directConversation.id,
          senderId: users[0].id,
          content:
            "I'm doing well too! Looking forward to our upcoming session.",
          type: 'TEXT',
          status: 'DELIVERED',
        },
      }),
    ]);

    // Add some reactions to messages
    await prisma.messageReaction.create({
      data: {
        messageId: messages[0].id,
        userId: users[1].id,
        emoji: '👍',
      },
    });

    // Create read receipts
    await prisma.messageReadReceipt.createMany({
      data: [
        {
          messageId: messages[0].id,
          userId: users[1].id,
        },
        {
          messageId: messages[1].id,
          userId: users[0].id,
        },
      ],
    });

    // Create a group conversation if we have enough users
    if (users.length >= 3) {
      const groupConversation = await prisma.conversation.create({
        data: {
          type: 'GROUP',
          title: 'Healthcare Team',
          description: 'Discussion group for healthcare coordination',
          createdBy: users[0].id,
          members: {
            create: users.slice(0, 3).map((user, index) => ({
              userId: user.id,
              isAdmin: index === 0,
            })),
          },
        },
      });

      // Add a welcome message to the group
      await prisma.message.create({
        data: {
          conversationId: groupConversation.id,
          senderId: users[0].id,
          content:
            'Welcome to the healthcare team group! This is where we can coordinate patient care and share important updates.',
          type: 'TEXT',
          status: 'SENT',
        },
      });
    }

    // Create a support conversation
    const supportConversation = await prisma.conversation.create({
      data: {
        type: 'SUPPORT',
        title: 'Customer Support',
        description: 'Get help from our support team',
        createdBy: users[0].id,
        members: {
          create: [
            {
              userId: users[0].id,
              isAdmin: false,
            },
          ],
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: supportConversation.id,
        senderId: users[0].id,
        content:
          'Hello, I need help with my account settings. Can someone assist me?',
        type: 'TEXT',
        status: 'SENT',
      },
    });

    console.log('✅ Messaging data seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${await prisma.conversation.count()} conversations`);
    console.log(`   - ${await prisma.message.count()} messages`);
    console.log(
      `   - ${await prisma.conversationMember.count()} conversation members`
    );
    console.log(
      `   - ${await prisma.messageReaction.count()} message reactions`
    );
    console.log(
      `   - ${await prisma.messageReadReceipt.count()} read receipts`
    );
  } catch (error) {
    console.error('❌ Error seeding messaging data:', error);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedMessaging()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
