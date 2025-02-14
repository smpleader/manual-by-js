function ManualByJs(options = {}){
    this.version = '0.1.5'
    this.flag = options.flag || ''
    this.folderContent = options.folderContent || 'content'
    this.siteTitle = options.siteTitle || 'Manual By JS'
    this.index = options.index || 'home'
    this.current = {}
    this.next = {}
    this.prev = {}
    this.menu = options.menu || []
    this.milestone = options.milestone || []

    this._init()
}

ManualByJs.prototype = {
    read: async function(page){
        
        let content = await fetch(this.folderContent + '/' + page + '.html')
        .then(response => response.text()) 
        .catch(error => {
            alert('Can not get page content "'+ page + '"!')
            console.error('Error fetching the file  page', error);
        });

        return content
    },
    findPageByIndex: function(idx, step)
    {
        finder = idx + step
        if(finder < 0 || finder == this.menu.length ) return false
        test = this.menu[finder]
        return test.slug ?  test : this.findPageByIndex(finder, step)
    },
    findPageByHash: function(hash)
    {
        for(var ind = 0; ind < this.menu.length; ind++)
        {
            item = this.menu[ind]
            if( (item.slug && hash == item.slug) || 
                (item.index && item.index.includes(hash)) )
            { 
                item.ordering = ind
                return item
            }
        }
        return false
    },
    _createSidebarMenu: function() {
        for(const item of this.menu)
        {
            var div = document.getElementById('mbj-menu')
            var line = item.slug ? 
                '<a href="#'+ item.slug +'" class="'+ item.slug +'">'+ item.title +'</a>' :
                ( item.href ? 
                    '<a href="'+ item.href +'" class="hover link" target="_blank">'+ item.title +'</a>' :
                    '<h6><strong>'+ item.title+'</strong></h6>'
                )
                
            div.insertAdjacentHTML("beforeend", line)
        }
    },
    _createIndexTable: function()  {
        var div = document.getElementById('mbj-index')
        div.innerHTML = ""
        if(this.current.index)
        { 
            div.insertAdjacentHTML("beforeend", '<li class="mt-3"><b>On this page</b></li>')
            for(const item of this.current.index)
            {
                if(typeof item == "string")
                {
                    let name = item.charAt(0).toUpperCase() + item.slice(1);
                    name = name.replace(/-_/g, ' ')
                    div.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item+'">'+name+'</a></li>')

                }
                else if( item.id && item.name)
                {
                    div.insertAdjacentHTML("beforeend", '<li><a class="item" href="#'+item.id+'">'+item.name+'</a></li>')
                }
            }
        }
    },
    _updateWindowTitle: function(line)
    {
        document.title = line
    },
    _sidebarMenuActivate: function(slug)
    {   
        const menu =  document.getElementById("mbj-menu");
        const anchors = menu.getElementsByTagName('a');
        for(const m of anchors)
        {
            if(m.classList.contains(slug))
            {
                m.classList.add("active")
            }
            else
            {
                m.classList.remove("active")
            }
        }
    },
    _footMenuActivate: function(ordering)
    {
        var div = document.getElementById('mbj-page-nav')
        div.innerHTML = ""
        this.prev = this.findPageByIndex(ordering, -1)
        if(false == this.prev)
        {
            div.insertAdjacentHTML("afterbegin", '<a class="invisible"><span>.</span></a>')
        } 
        else 
        {
            div.insertAdjacentHTML("afterbegin", 
                '<a href="#'+this.prev.slug+'" class="">' +
                    '<span>Previous page</span>' +
                    this.prev.title +
                '</a>');
        }

        this.next = this.findPageByIndex(ordering, 1)

        if(false !==  this.next)
        {
            div.insertAdjacentHTML("beforeend", 
                '<a href="#'+this.next.slug+'" class="text-end">' +
                    '<span>Next page</span>' +
                    this.next.title +
                '</a>');
        } 
    },
    _setSiteTitle: function()
    {
        document.getElementById('mbj-site-title').innerText = this.siteTitle
    },
    _createMilestoneMenu: function()
    {
        if(this.milestone.length > 0)
        {
            var div = document.getElementById('mbj-milestone')
            div.innerHTML = ''
            for(const item of this.milestone)
            {
                div.insertAdjacentHTML("beforeend", 
                    '<li><a class="dropdown-item" href="' + item.href + '">'+ item.title +'</a></li>' )
            }
            var txt = document.getElementById('mbj-milestone-menu')
            txt.innerHTML = 'Latest is ' + this.milestone[0].title
        }
    },

    navigate: async function(hash){
        let item = this.findPageByHash(hash)
        if(item)
        {
            this.current = item

            let content = ''

            if(item.alias) 
            {
                content = await this.read(item.alias)
            }
            else 
            {
                if(item.parts)
                {
                    for(const page of item.parts)
                    {
                        content += await this.read(page)
                    }
                }
                else
                {
                    content = await this.read(item.slug)
                }
            }

            var div = document.getElementById('mbj-page') 
            div.innerHTML = ""
            div.insertAdjacentHTML("afterbegin", content) 

            this._sidebarMenuActivate(item.slug)
            this._updateWindowTitle(this.siteTitle + " - " + this.current.title)
            this._createIndexTable()
            this._footMenuActivate(item.ordering)

            // if item found by index, we won't scroll it
            if(item.slug === hash)
            {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
    }, 
    _init: async function(){ 

        if(this.menu.length == 0)
        {    
            this.menu = await fetch(this.folderContent + '/menu.json')
            .then(response => response.text())
            .then(data => JSON.parse(data))
            .catch(error => {
                alert('Can not create menu!')
                console.error('Error fetching the file  menu', error);
            });
        }
            
        let hash = window.location.hash.substring(1);
        if(hash.length == 0) hash = this.index
        
        await this.navigate( hash )

        this._createSidebarMenu() 
        this._setSiteTitle()
        this._createMilestoneMenu()

        // global event
        that = this
    
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.substring(1); // Remove the '#' character
            that.navigate(hash);
        });
    }
}