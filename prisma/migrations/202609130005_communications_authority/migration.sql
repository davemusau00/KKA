ALTER TABLE "ChannelMembership"
  ADD COLUMN "lastReadAt" TIMESTAMP(3),
  ADD COLUMN "lastReadMessageId" TEXT;

ALTER TABLE "CommunicationChannel"
  ADD COLUMN "channelKey" TEXT;

ALTER TABLE "Task"
  ADD COLUMN "sourceMessageId" TEXT;

CREATE TABLE "MessageMention" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessageMention_userId_readAt_createdAt_idx"
  ON "MessageMention"("userId", "readAt", "createdAt");

CREATE UNIQUE INDEX "MessageMention_messageId_userId_key"
  ON "MessageMention"("messageId", "userId");

CREATE UNIQUE INDEX "CommunicationChannel_firmId_channelKey_key"
  ON "CommunicationChannel"("firmId", "channelKey");

CREATE UNIQUE INDEX "Task_sourceMessageId_key"
  ON "Task"("sourceMessageId");

ALTER TABLE "MessageMention"
  ADD CONSTRAINT "MessageMention_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
