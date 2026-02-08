export const dynamic = "force-dynamic";

type SignUpPayload = {
  email: string;
  password: string;
  name?: string;
  username?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function baseUsernameFromEmail(email: string) {
  return email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
}

export async function POST(request: Request) {
  try {
    const [{ default: prisma }, { default: bcrypt }] = await Promise.all([
      import("@/lib/prisma"),
      import("bcryptjs"),
    ]);
    const body = (await request.json()) as SignUpPayload;
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let username = (body.username ?? baseUsernameFromEmail(email)).trim();
    if (!username) username = `user${Date.now()}`;

    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? username : `${username}${suffix}`;
      const usernameTaken = await prisma.user.findUnique({ where: { username: candidate } });
      if (!usernameTaken) {
        username = candidate;
        break;
      }
      suffix += 1;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || null,
        username,
        passwordHash,
      },
      select: { id: true, email: true },
    });

    return Response.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Sign-up failed:", error);
    return Response.json({ error: "Sign-up failed" }, { status: 500 });
  }
}
