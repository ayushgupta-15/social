import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return res.status(200).json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const unreadIds = notifications.filter((notification) => !notification.read).map((n) => n.id);
    const unreadCount = unreadIds.length;

    if (unreadIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true },
      });
    }

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to fetch notifications API:", error);
    return res.status(200).json({ notifications: [], unreadCount: 0 });
  }
}
