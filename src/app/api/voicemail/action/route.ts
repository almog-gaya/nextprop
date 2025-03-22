export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const action = searchParams.get('action')
    console.log(campaignId, action);
    if (action == "pause") {
        const result = await _pauseCampaign(campaignId!);
        return Response.json(result);
    } else if (action == "resume") {
        const result = await _resumeCampaign(campaignId!);
        return Response.json(result);
    } else {
        return Response.json({
            message: "Invalid action",
        });
    }
}

const _pauseCampaign = async (campaignId: string) => {
    const result = await fetch(`https://backend.iky.link/pause/${campaignId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    })
    return await result.json();
}

const _resumeCampaign = async (campaignId: string) => {
    const result = await fetch(`https://backend.iky.link/resume/${campaignId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    })
    return await result.json();
}