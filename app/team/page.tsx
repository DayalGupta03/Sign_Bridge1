"use client"

import { motion } from "framer-motion"
import { Github, Linkedin, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TeamPage() {
    const teamMembers = [
        {
            id: 1,
            name: "TEAM MEMBER 1",
            role: "Full Stack Developer",
            linkedin: "#",
            github: "#",
        },
        {
            id: 2,
            name: "TEAM MEMBER 2",
            role: "AI Engineer",
            linkedin: "#",
            github: "#",
        },
        {
            id: 3,
            name: "TEAM MEMBER 3",
            role: "Frontend Specialist",
            linkedin: "#",
            github: "#",
        },
        {
            id: 4,
            name: "TEAM MEMBER 4",
            role: "Backend Architect",
            linkedin: "#",
            github: "#",
        },
        {
            id: 5,
            name: "TEAM MEMBER 5",
            role: "UI/UX Designer",
            linkedin: "#",
            github: "#",
        },
        {
            id: 6,
            name: "TEAM MEMBER 6",
            role: "Project Manager",
            linkedin: "#",
            github: "#",
        },
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Elements - Same as Home */}
            <div className="absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-primary/10 via-background to-transparent opacity-50" />
                <div style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} className="absolute inset-0 opacity-20" />
            </div>

            <div className="container relative z-10 mx-auto px-6 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                        Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">SignBridge Team</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                        The innovative minds behind the real-time AI mediation platform. We are a team of 6 passionate developers bridging the communication gap.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teamMembers.map((member, i) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-colors duration-300"
                        >
                            <div className="flex items-start gap-4">
                                {/* Image Placeholder */}
                                <div className="h-24 w-24 shrink-0 rounded-xl bg-muted overflow-hidden border border-border group-hover:border-primary/30 transition-colors">
                                    <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground/50">
                                        <Users className="h-8 w-8" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold truncate text-foreground group-hover:text-primary transition-colors">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">{member.role}</p>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                                            <Link href={member.linkedin} target="_blank">
                                                <Linkedin className="h-4 w-4" />
                                                <span className="sr-only">LinkedIn</span>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                                            <Link href={member.github} target="_blank">
                                                <Github className="h-4 w-4" />
                                                <span className="sr-only">GitHub</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
