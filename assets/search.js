function SearchForManual( mbjInstance, options = {}){
    if(Object.getPrototypeOf(mbjInstance) !== ManualByJs.prototype)
    {
        alert("Invalid MBJ instance")
        return false
    }

    this.version = '0.0.1'
    this.minPageAllowCache = options.minPageAllowCache || 50
    this.maxPageAllowCache = options.maxPageAllowCache || 50
    this.ids = {
        input: "searcher-input",
        opt: "searcher-option",
        prg: "searcher-progress",
        res: "searcher-result",
    }

    this.manual = mbjInstance
    this.result = []

    if(options.ids) this.ids = {...this.ids, ...options.ids}

    this.schr = {}
    
    for (let [key, id] of Object.entries(this.ids)) 
    {
        this.schr[key] = document.getElementById(id)
    }

    this.hook = {
        afterSearching: null,
        onSearching: null
    }

    if(options.hook) this.hook = {...options.hook}

    this._init()
}

SearchForManual.prototype = {
    _search:  async function(txt)
    { // todo cache the data: compare  this.manual.menu.length
        this.result = [] 
        let  i = 0, regex = new RegExp(txt, "i")

        while(page = this.manual.findPageByOrder(i, 1))
        { 
            i++ 
            content = await this.manual.digContent(page)
            //console.log(content);
            noHTML = content.replace(/(<([^>]+)>)/ig, '')
            if(regex.test(noHTML))
            {
                this.result.push(page)
            }
            this._onSearching(i, page)
        }
        this._afterSearching()
    },
    _afterSearching: function() {
        if(this.hook.afterSearching instanceof Function)
        {
            this.hook.afterSearching()
            return
        }    
        this.schr.prg.innerHTML = this.result.length +" found"
        if(this.result.length)
        {
            
            this.schr.res.innerHTML = "A list show here"  
        }
        else
        {
            this.schr.res.innerHTML = ""
        }
    },
    _onSearching: function(i, page)
    {
        if(this.hook.onSearching instanceof Function)
        {
            this.hook.onSearching(i, page)
            return
        }

        this.schr.res.innerHTML = ""
        this.schr.prg.innerHTML = i ? "<i>searching " + i + "/" + this.manual.menu.length + "</i>" : "<i>wait for your input</i>" 
        
    },
    _init: async function()
    {
        if(this.schr.input)
        {
            let delaySearch
            this.schr.input.addEventListener('keyup', () => { 
                this._onSearching(0, 0)
                clearTimeout(delaySearch)
                if(this.schr.input.value.length > 2)
                {
                    delaySearch = setTimeout(() => {
                        this._search( this.schr.input.value); 
                    }, 1000)
                     
                }
            })
        }
    }
}