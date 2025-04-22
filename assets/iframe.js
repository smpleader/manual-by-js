if(window.top.driverJs)
{
    setTimeout(()=>{
        const tourjs = window.top.driverJs()
        tourjs.setSteps(window.top.app.current.tour)
        tourjs.drive()
    }, 500)
}
